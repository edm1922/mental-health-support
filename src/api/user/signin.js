import { supabase } from '../../utils/supabaseClient';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, password } = req.body;

    console.log("Sign-in request received:", { email }); // Log the incoming request

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Sign-in error:", error); // Log the error
      return res.status(401).json({ error: error.message });
    }

    return res.status(200).json({ user: data.user });
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
