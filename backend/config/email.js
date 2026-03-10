import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// Resend API Key එක හරහා සම්බන්ධ වීම
export const resend = new Resend(process.env.RESEND_API_KEY);