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
      action: 'create',
      geminiApiKey: 'dummy',
      data: {
        title: "Test Project",
        description: "Test description",
        requirements: ["Test"],
        payment_algo: 10.5,
        score_threshold: 80,
        wallet_address: "TESTWALLET"
      }
    })
  });
  
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}

test();
