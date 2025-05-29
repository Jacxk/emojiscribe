"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search } from "lucide-react"
import Emoji from "@/app/components/emoji"

interface EmojiMatch {
  emoji: string
  matchPercentage: number
  matchedKeywords: string[]
  category: string
  name: string
}

interface EmojiResponse {
  text: string
  matches: EmojiMatch[]
}

export default function Home() {
  const [text, setText] = useState("")
  const [emojiData, setEmojiData] = useState<EmojiResponse>({
    text: "",
    matches: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleGetEmoji = async () => {
    if (!text.trim()) return

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/emoji", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      setEmojiData(data)
    } catch (error) {
      console.error("Error fetching emoji:", error)
      setError(error instanceof Error ? error.message : "Unknown error occurred")
      setEmojiData({
        text: text.trim(),
        matches: [
          {
            emoji: "❌",
            matchPercentage: 0,
            matchedKeywords: ["error"],
            category: "symbols",
            name: "cross mark",
          },
        ],
      })
    } finally {
      setIsLoading(false)
      // Refocus the input after submission
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleGetEmoji()
    }
  }

  // Example API response for display
  const exampleResponse = {
    text: "happy cat",
    matches: [
      {
        emoji: "😸",
        matchPercentage: 92,
        matchedKeywords: ["happy", "cat", "grinning"],
        category: "emotion",
        name: "grinning cat with smiling eyes",
      },
      {
        emoji: "😺",
        matchPercentage: 87,
        matchedKeywords: ["happy", "cat", "smiling"],
        category: "emotion",
        name: "grinning cat",
      },
      {
        emoji: "🐱",
        matchPercentage: 65,
        matchedKeywords: ["cat", "face"],
        category: "animal",
        name: "cat face",
      },
      {
        emoji: "😊",
        matchPercentage: 48,
        matchedKeywords: ["happy", "smiling"],
        category: "emotion",
        name: "smiling face with smiling eyes",
      },
      {
        emoji: "🙂",
        matchPercentage: 32,
        matchedKeywords: ["happy"],
        category: "emotion",
        name: "slightly smiling face",
      },
    ],
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <section itemScope itemType="https://schema.org/WebApplication" className="max-w-2xl mx-auto pt-16">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Emojiscribe</h1>
          <p className="text-lg text-gray-600">Transform your words into the perfect emoji with AI-powered matching</p>
        </header>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Type your message</CardTitle>
            <CardDescription>
              Enter any text and get up to 5 emoji matches with percentages. Include emojis in your text for higher
              ratings!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Try: 'I love cats 😸', 'smiling face', or 'happy birthday'"
                className="text-lg p-4 h-12 flex-1"
                disabled={isLoading}
                aria-label="Enter text to convert to emoji"
                aria-describedby="input-description"
              />
              <Button onClick={handleGetEmoji} disabled={!text.trim() || isLoading} size="lg" className="h-12 px-6">
                <Search className="h-4 w-4 mr-2" />
                {isLoading ? "Analyzing..." : "Get Emojis"}
              </Button>
            </div>
            {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">Error: {error}</div>}
            <span id="input-description" className="sr-only">
              Enter any text and we'll find up to 5 emoji matches with AI analysis
            </span>
          </CardContent>
        </Card>

        <Emoji text={emojiData.text} isLoading={isLoading} matches={emojiData.matches} />

        <div className="mt-8 text-center">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">API Usage</CardTitle>
              <CardDescription>Send a POST request to get emoji matches with detailed analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-left space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Request:</h4>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <code className="text-sm">
                      POST /api/emoji
                      <br />
                      Content-Type: application/json
                      <br />
                      <br />
                      {JSON.stringify({ text: "happy cat" }, null, 2)}
                    </code>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Response:</h4>
                  <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm">
                      <code>{JSON.stringify(exampleResponse, null, 2)}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
