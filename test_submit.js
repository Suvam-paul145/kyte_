async function test() {
  const supabaseUrl = "https://ugesrwzveiybyoidimvo.supabase.co";
  const supabaseKey = "sb_publishable_SQT0pxc5Y4E5jS6faWn9fA_2Mvc9h3U";
  
  const res = await fetch(`${supabaseUrl}/functions/v1/gemini-audit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`
    },
    body: JSON.stringify({
      action: 'submit',
      geminiApiKey: 'dummy',
      data: {
        projectId: "9812309b-434e-4edc-8baa-1c4d4dbab441",
        githubUrl: "https://github.com/VishalNandy17/kyte_"
      }
    })
  });
  
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}

test();
