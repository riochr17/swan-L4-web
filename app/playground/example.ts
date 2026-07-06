export const PLAYGROUND_TEMPLATES = [
  {
    title: "Hello World",
    code: `TITLE Hello World
SAY Welcome to the Swan L4 DSL!
SAY What is your name?
LISTEN
SAY Nice to meet you, {Context}!\n`
  },
  {
    title: "Interactive Prompt",
    code: `TITLE Interactive Prompt
SAY Tell me a topic you want to write a short poem about:
LISTEN
THINK Write a short 2-line funny poem about it.
SAY \`\`\`
Here is your poem:
{Context}
\`\`\`\n`
  },
  {
    title: "Odd or Even Classifier",
    code: `TITLE Odd or Even Classifier
SAY Please enter a number:
$number LISTEN
IF the number is even:
  SAY The number is even!
ELSE:
  SAY The number is odd!\n`
  },
  {
    title: "Language Translator",
    code: `TITLE Language Translator
SAY Enter English text to translate to Indonesian:
LISTEN
THINK Translate the text to Indonesian
SAY \`\`\`
Translated text:
{Context}
\`\`\`\n`
  },
  {
    title: "Weather Agent",
    code: `TITLE Advanced Weather Agent
#DEFINE CALL_WEATHER https://wttr.in

SAY Which city's weather would you like to check? single name, example: jakarta
$city LISTEN
CALL_WEATHER /{$city}?format=3
IF the weather in {$city} is rainy or snowy:
  SAY Remember to bring an umbrella today!
ELSE:
  SAY Have a wonderful day outdoors!\n`
  },
  {
    title: "Support Ticket Router",
    code: `TITLE Support Ticket Router
SAY Welcome to Support. Please describe your issue:
LISTEN
$dept THINK Classify this issue into Billing, Tech Support, or Sales
SAY Routing ticket to {$dept}...
IF department {$dept} is Billing:
  SAY Billing agents are online from 9 AM to 5 PM.
ELSE:
  IF department {$dept} is Tech Support:
    SAY Tech agents will respond within 2 hours.
  ELSE:
    SAY Connecting you to Sales right now!\n`
  },
  {
    title: "Interactive Quiz",
    code: `TITLE Interactive Quiz
SAY Welcome to the Trivia Quiz!
$score THINK Initialize score to 0.

SAY Question 1: What is the capital of France?
LISTEN
IF answer is Paris:
  SAY Correct!
  $score THINK Increment score by 1 from {$score}.
ELSE:
  SAY Incorrect. The capital is Paris.

SAY Question 2: How many continents are there?
LISTEN
IF answer is 7:
  SAY Correct!
  $score THINK Increment score by 1 from {$score}.
ELSE:
  SAY Incorrect. The answer is 7.

SAY Your final quiz score is: {$score}\n`
  },
  {
    title: "Stock Advisor",
    code: `TITLE Stock Advisor
#DEFINE CALL_STOCK https://query1.finance.yahoo.com/v8/finance/chart

SAY Enter stock ticker (e.g. AAPL, TSLA):
$ticker LISTEN
$stock_data CALL_STOCK /{$ticker}?range=1d&interval=1m
$advice THINK Analyze this stock chart data: {$stock_data}. Suggest whether to BUY, HOLD, or SELL {$ticker} today and explain why.
SAY \`\`\`
Investment Recommendation:
{$advice}
\`\`\`\n`
  },
  {
    title: "Smart Home Automation",
    code: `TITLE Smart Home Automation
WRITE ./devices.json \`\`\`
{
  "ac": "off",
  "lights": "on"
}
\`\`\`
$status READ ./devices.json
SAY Current Smart Home Status: {$status}
SAY What action would you like to perform? (e.g., turn off AC, turn on lights)
LISTEN
$updated_status THINK Based on current status: {$status}, apply the action: {Context}. Return the updated status as a valid JSON string.
WRITE ./devices.json {$updated_status}
SAY Smart devices updated successfully! New status:
READ ./devices.json
SAY {Context}\n`
  },
  {
    title: "Autonomous Research Agent",
    code: `TITLE Autonomous Research Agent
SAY Enter research topic:
$topic LISTEN
$notes THINK Write a comprehensive bullet-point summary of the core facts and key aspects of {$topic}.
WRITE ./research_notes.txt {$notes}
LOOP:
  $current_draft READ ./research_notes.txt
  SAY Generating article draft...
  $draft THINK Based on these notes: {$current_draft}, write a 3-paragraph article draft about {$topic}.
  SAY Current Draft:
  SAY {$draft}
  SAY Does this draft require any edits? (Enter your feedback, or type 'approve' to finalize)
  $feedback LISTEN
  IF feedback {$feedback} is approve:
    SAY Final article saved to draft.txt!
    WRITE ./draft.txt {$draft}
    EXIT LOOP
  ELSE:
    SAY Revising draft with your feedback...
    $notes THINK \`\`\`
    Revise these notes:
    {$current_draft}

    incorporate the user feedback:
    {$feedback}
    \`\`\`
    WRITE ./research_notes.txt {$notes}\n`
  },
  {
    title: "Store Staff",
    code: `TITLE Store Staff

WRITE price-list.txt \`\`\`
| No | Nama Buah          | Harga (Rp/kg) |
| -- | ------------------ | ------------: |
| 1  | Apel Fuji          |      Rp32.950 |
| 2  | Apel Hijau         |      Rp36.250 |
| 3  | Anggur Hijau       |      Rp63.500 |
| 4  | Anggur Merah       |      Rp59.950 |
| 5  | Pisang             |      Rp18.000 |
| 6  | Jeruk Kintamani    |      Rp19.850 |
| 7  | Mangga Harum Manis |      Rp26.850 |
| 8  | Buah Naga          |      Rp26.950 |
| 9  | Melon              |      Rp20.000 |
| 10 | Semangka           |      Rp12.000 |
| 11 | Pepaya             |      Rp10.000 |
| 12 | Nanas              |      Rp15.000 |
| 13 | Jambu Biji         |       Rp7.650 |
| 14 | Alpukat            |      Rp29.000 |
| 15 | Lengkeng           |      Rp24.500 |
\`\`\`

WRITE scratchpad.txt ""
SAY Welcome to our Fresh Fruit Store
LOOP:
  $last_context CONTEXT:
    READ scratchpad.txt
    $user_request LISTEN
  IF user wants to buy specific type of fruit with specific amount:
    $cart THINK extract user request and quantity from this request {$last_context}
    READ price-list.txt
    THINK calculate price based on this user cart {$cart}
    SAY THINK tell user!
    EXIT LOOP
  ELSE:
    CONTEXT:
      READ price-list.txt
      READ scratchpad.txt
    SAY THINK answer user request: {$user_request}
    WRITE scratchpad.txt {$last_context}\n`
  },
];