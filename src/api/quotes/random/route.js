async function handler() {
  try {
    const [quote] = await sql`
      SELECT quote, author 
      FROM inspirational_quotes 
      ORDER BY RANDOM() 
      LIMIT 1
    `;

    if (!quote) {
      return { error: "No quotes found" };
    }

    return { quote: quote.quote, author: quote.author };
  } catch (error) {
    return { error: "Failed to fetch quote" };
  }
}