import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ugesrwzveiybyoidimvo.supabase.co";
const key = "sb_publishable_SQT0pxc5Y4E5jS6faWn9fA_2Mvc9h3U";
const supabase = createClient(supabaseUrl, key);

async function test() {
  console.log("Invoking edge function via supabase-js...");
  try {
    const { data, error } = await supabase.functions.invoke('gemini-audit', {
      body: {
        action: "create",
        geminiApiKey: "dummy",
        data: {
          title: "test project",
          description: "description",
          requirements: ["test"],
          payment_algo: 1,
          score_threshold: 80,
          wallet_address: "0xTest"
        }
      }
    });
    
    if (error) {
      console.error("Supabase Invoke Error:", error.message);
      console.error("Full Error Object:", JSON.stringify(error, null, 2));
    } else {
      console.log("Success Data:", data);
    }
  } catch (err) {
    console.error("Try/Catch Error:", err);
  }
}

test();
