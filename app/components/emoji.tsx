import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface EmojiMatch {
  emoji: string
  matchPercentage: number
  matchedKeywords: string[]
  category: string
  name: string
}

interface EmojiProps {
  text: string
  isLoading: boolean
  matches: EmojiMatch[]
}

export default function Emoji({ text, isLoading, matches }: EmojiProps) {
  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-100 text-green-800"
    if (percentage >= 60) return "bg-yellow-100 text-yellow-800"
    if (percentage >= 40) return "bg-orange-100 text-orange-800"
    return "bg-red-100 text-red-800"
  }

  if (isLoading) {
    return (
      <Card className="text-center">
        <CardContent className="pt-8 pb-8">
          <div className="text-8xl mb-4 transition-all duration-300">🔍</div>
          <p className="text-gray-600 mb-2">Finding the perfect emojis...</p>
        </CardContent>
      </Card>
    )
  }

  if (!matches || matches.length === 0) {
    return (
      <Card className="text-center">
        <CardContent className="pt-8 pb-8">
          <div className="text-8xl mb-4 transition-all duration-300">😊</div>
          <p className="text-gray-600 mb-2">Click the button to get emojis!</p>
        </CardContent>
      </Card>
    )
  }

  const topMatch = matches[0]

  return (
    <div className="space-y-6">
      {/* Main emoji display */}
      <Card className="text-center">
        <CardContent className="pt-8 pb-8">
          <div className="text-8xl mb-4 transition-all duration-300">{topMatch.emoji}</div>

          <div className="mb-4">
            <Badge className={`text-sm font-semibold ${getMatchColor(topMatch.matchPercentage)}`}>
              {topMatch.matchPercentage}% match
            </Badge>
          </div>

          <p className="text-gray-600 mb-2">{text ? `Best match for: "${text}"` : "Click the button to get emojis!"}</p>

          <p className="text-sm text-gray-500 mb-2">
            {topMatch.name} {topMatch.category && `(${topMatch.category})`}
          </p>

          {topMatch.matchedKeywords && topMatch.matchedKeywords.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-400 mb-2">Matched keywords:</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {topMatch.matchedKeywords.slice(0, 5).map((keyword, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alternative matches */}
      {matches.length > 1 && (
        <Card>
          <CardContent className="pt-6 pb-6">
            <h3 className="text-lg font-semibold mb-4 text-center">Other matches</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {matches.slice(1).map((match, index) => (
                <div key={index} className="text-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="text-3xl mb-2">{match.emoji}</div>
                  <Badge className={`text-xs ${getMatchColor(match.matchPercentage)}`}>{match.matchPercentage}%</Badge>
                  <p className="text-xs text-gray-500 mt-1 truncate" title={match.name}>
                    {match.name}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
