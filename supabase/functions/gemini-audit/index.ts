// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let payload;
    try {
      payload = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON payload." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { action, geminiApiKey, data } = payload

    if (action === 'test') {
      return new Response(JSON.stringify({ status: "ok", message: "Edge function is reachable and working." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: "geminiApiKey is required." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'create') {
      // Create Project Flow
      const { data: projectData, error } = await supabaseClient
        .from('projects')
        .insert({
          title: data.title,
          description: data.description,
          requirements: data.requirements,
          payment_algo: data.payment_algo,
          score_threshold: data.score_threshold,
          wallet_address: data.wallet_address,
          status: 'OPEN'
        })
        .select()
        .single();
      
      if (error) throw error;

      return new Response(JSON.stringify(projectData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } 
    
    if (action === 'submit') {
      console.log("Submit action received with data:", JSON.stringify(data));
      // Evaluate Project Flow
      const { projectId, githubUrl } = data;
      
      if (!projectId || !githubUrl) {
        console.error("Missing projectId or githubUrl");
        return new Response(JSON.stringify({ error: "projectId and githubUrl are required." }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Fetch project details for requirements
      console.log("Fetching project details for ID:", projectId);
      const { data: project, error: fetchError } = await supabaseClient
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (fetchError) {
        console.error("Fetch error:", fetchError);
        throw fetchError;
      }
      console.log("Project found:", project.title);

      // Update DB to IN_REVIEW
      await supabaseClient
        .from('projects')
        .update({ status: 'IN_REVIEW', github_url: githubUrl })
        .eq('id', projectId);

      // List Gemini Models
      console.log("Listing Gemini models...");
      let modelName = "gemini-2.5-flash";
      
      if (geminiApiKey !== "dummy") {
        const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`);
        const modelsData = await modelsRes.json();
        
        if (!modelsRes.ok) {
          console.error("Gemini models error:", modelsData.error);
          throw new Error(modelsData.error?.message || "Failed to list Gemini models. Check your API key.");
        }
        
        // Select Default Model
        const flashModel = modelsData.models?.find((m: any) => m.name.includes("gemini-2.5-flash")) || 
                           modelsData.models?.find((m: any) => m.name.includes("gemini-1.5-flash")) || 
                           modelsData.models[0];
        modelName = flashModel ? flashModel.name.split("/")[1] : "gemini-2.5-flash"; // default fallback
      } else {
        console.log("Mocking Gemini model selection (dummy key detected)");
      }
      console.log("Selected model:", modelName);

      // Run Evaluation
      
      // --- GitHub Fetching Logic ---
      async function fetchRepoContent(url: string) {
        console.log("Parsing GitHub URL:", url);
        // Better regex to handle various GitHub URL formats
        const match = url.match(/github\.com\/([^/]+)\/([^/ ?#]+)/);
        if (!match) return "Could not parse GitHub URL";
        const owner = match[1];
        const repo = match[2].replace(".git", "");
        
        try {
          console.log(`Fetching contents for ${owner}/${repo}...`);
          // Fetch file list from root (Requires User-Agent)
          const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
             headers: { 
               'Accept': 'application/vnd.github.v3+json',
               'User-Agent': 'Kyte-Auditor-Edge-Function'
             }
          });
          if (!response.ok) return `Failed to fetch repo (${response.status}): ${response.statusText}`;
          
          const files = await response.json();
          let combinedCode = "";
          
          // Fetch content of relevant files (limit to top 10 files)
          const relevantFiles = files.filter((f: any) => 
            f.type === 'file' && (f.name.endsWith('.py') || f.name.endsWith('.teal') || f.name.endsWith('.sol'))
          ).slice(0, 10);

          console.log(`Found ${relevantFiles.length} relevant files.`);

          for (const file of relevantFiles) {
            console.log(`Fetching content for ${file.path}...`);
            const contentRes = await fetch(file.download_url);
            if (contentRes.ok) {
              const text = await contentRes.text();
              combinedCode += `\n--- File: ${file.path} ---\n${text}\n`;
            }
          }
          return combinedCode || "No relevant source code files found in the root directory.";
        } catch (e) {
          console.error("GitHub fetch error:", e);
          return `Error fetching repository: ${e.message}`;
        }
      }

      const repoContent = await fetchRepoContent(githubUrl);
      const requirementsStr = project.requirements?.join("\n- ") || "No specific requirements";
      
      let evaluationResult;

      if (geminiApiKey !== "dummy") {
        const prompt = `You are a professional security auditor. Your task is to audit the provided GitHub repository.
        
GITHUB REPOSITORY CONTENT:
${repoContent}

EVALUATION REQUIREMENTS:
- ${requirementsStr}

Respond ONLY with a valid JSON object in the following format (no markdown code blocks, just raw JSON):
{
  "overall_score": number (0-100),
  "results": [
    {
      "requirement": "the exact text of the requirement",
      "met": boolean,
      "score": number (0-100),
      "reason": "short explanation"
    }
  ],
  "gap_report": "what was missing or can be improved (optional)"
}

Ensure the "results" array contains an entry for EVERY requirement listed above.`;
        
        console.log("Sending prompt to Gemini...");
        const generationRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0
            }
          })
        });
        
        const generationData = await generationRes.json();
        if (!generationRes.ok) {
          console.error("Gemini generation error:", generationData.error);
          throw new Error(generationData.error?.message || "Failed to generate audit content. Check API key/Quota.");
        }
        
        const responseText = generationData.candidates[0]?.content?.parts[0]?.text || "{}";
        console.log("Gemini response received.");

        try {
           const cleanedJson = responseText.replace(/```json|```/g, '').trim();
           evaluationResult = JSON.parse(cleanedJson);
        } catch (e) {
           console.error("JSON parse error for AI response:", e);
           evaluationResult = { 
             overall_score: 0, 
             results: (project.requirements || []).map((r: string) => ({ requirement: r, met: false, score: 0, reason: "Failed to parse AI output" })), 
             gap_report: "AI output could not be parsed: " + responseText 
           };
        }
      } else {
        console.log("Mocking evaluation (dummy key detectec)");
        evaluationResult = {
          overall_score: 95,
          results: (project.requirements || []).map((r: string) => ({
             requirement: r, met: true, score: 95, reason: "Mock pass for testing."
          })),
          gap_report: "This is a mock evaluation result for testing."
        };
      }

      // Finalize DB
      const passed = evaluationResult.overall_score >= (project.score_threshold || 80);
      const finalStatus = passed ? 'COMPLETED' : 'DISPUTED';
      
      console.log("Updating project status to:", finalStatus);
      const { data: updatedProject, error: updateError } = await supabaseClient
        .from('projects')
        .update({ 
           status: finalStatus,
           evaluation_result: evaluationResult
        })
        .eq('id', projectId)
        .select()
        .single();
        
      if (updateError) {
        console.error("DB update error:", updateError);
        throw updateError;
      }
      
      return new Response(JSON.stringify(updatedProject), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
    
  } catch (err) {
    const error = err as Error;
    console.error('Edge Function Error:', error.message, error.stack)
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 200, // Returning 200 with error property so client can parse it instead of raw 500 error page
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
