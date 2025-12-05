import { NextRequest, NextResponse } from 'next/server';

// Interface untuk pesan chat
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Endpoint POST untuk menangani pesan chat.
 * Menerima array pesan, mengirimkannya ke Groq API, dan mengembalikan respons.
 */
export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Siapkan payload untuk Groq API
    const groqPayload = {
      // Menggunakan Llama 3 8B yang cepat dan gratis
      model: 'openai/gpt-oss-120b', 
      
      // Kirim seluruh riwayat pesan untuk konteks chat
      messages: messages.map((msg: ChatMessage) => ({
        role: msg.role,
        content: msg.content
      })),
      
      // Pengaturan parameter generasi
      temperature: 0.6,
      max_tokens: 512,
      stream: false, // Kita handle non-streaming di sini
    };

    // Panggil Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(groqPayload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API Error:', errorData);
      return NextResponse.json(
        { error: `Groq API error: ${response.status} - ${errorData}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Ekstrak respons AI dari format Groq/OpenAI
    const aiResponse = data.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response.';

    // Kembalikan respons yang sudah rapi
    return NextResponse.json({
      message: aiResponse.trim()
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}