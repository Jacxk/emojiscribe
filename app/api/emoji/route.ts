import { type NextRequest, NextResponse } from "next/server"
import { findBestEmojiMatches } from "@/lib/emoji-matcher"

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("JSON parsing error:", parseError)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { text } = body

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    if (typeof text !== "string") {
      return NextResponse.json({ error: "Text must be a string" }, { status: 400 })
    }

    const matches = findBestEmojiMatches(text)

    return NextResponse.json({
      text: text.trim(),
      matches: matches.map((match) => ({
        emoji: match.emoji,
        matchPercentage: match.matchPercentage,
        matchedKeywords: match.matchedKeywords,
        category: match.category,
        name: match.name,
      })),
    })
  } catch (error) {
    console.error("Error processing emoji request:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Emojiscribe API - Send a POST request with { "text": "your message" } to get up to 5 emoji matches',
    usage: {
      method: "POST",
      endpoint: "/api/emoji",
      body: { text: "string" },
      response: {
        text: "string",
        matches: [
          {
            emoji: "string",
            matchPercentage: "number",
            matchedKeywords: "string[]",
            category: "string",
            name: "string",
          },
        ],
      },
    },
  })
}
