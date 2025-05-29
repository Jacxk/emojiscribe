import { emojiDatabase, letterEmojis, type EmojiData } from "./emoji-database"

interface EmojiMatch {
  emoji: string
  name: string
  matchPercentage: number
  matchedKeywords: string[]
  category: string
  semanticScore: number
  contextScore: number
}

interface MatchAnalysis {
  directMatches: string[]
  partialMatches: string[]
  semanticMatches: string[]
  contextWords: string[]
  contextWordsNoStopWords: string[]
  containedEmojis: string[]
  sentiment: "positive" | "negative" | "neutral" | "question"
  wordPositions: Map<string, number[]>
  proximityPairs: Array<{ word1: string; word2: string; distance: number }>
}

// Common English stop words
const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "he",
  "in",
  "is",
  "it",
  "its",
  "of",
  "on",
  "that",
  "the",
  "to",
  "was",
  "will",
  "with",
  "i",
  "me",
  "my",
  "we",
  "our",
  "you",
  "your",
  "they",
  "them",
  "their",
  "this",
  "these",
  "those",
  "but",
  "or",
  "not",
  "can",
  "could",
  "would",
  "should",
  "have",
  "had",
  "do",
  "does",
  "did",
  "am",
  "been",
  "being",
  "get",
  "got",
  "go",
  "went",
  "come",
  "came",
  "see",
  "saw",
  "know",
  "knew",
  "think",
  "thought",
  "say",
  "said",
  "make",
  "made",
  "take",
  "took",
  "give",
  "gave",
  "put",
  "let",
  "may",
  "might",
  "must",
  "shall",
  "should",
  "will",
  "would",
  "could",
  "can",
])

// Helper function to escape regex special characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// Remove stop words from text
function removeStopWords(words: string[]): string[] {
  return words.filter((word) => !STOP_WORDS.has(word.toLowerCase()) && word.length > 2)
}

// Extract emojis from text using Unicode ranges
function extractEmojisFromText(text: string): string[] {
  const emojiRegex =
    /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE0F}]|[\u{200D}]/gu
  const matches = text.match(emojiRegex)
  return matches ? [...new Set(matches)] : []
}

// Remove emojis from text for processing
function removeEmojisFromText(text: string): string {
  const emojiRegex =
    /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE0F}]|[\u{200D}]/gu
  return text.replace(emojiRegex, " ").replace(/\s+/g, " ").trim()
}

// Check if emoji name contains any input words
function getEmojiNameMatches(
  emojiName: string,
  inputWords: string[],
): { exactMatch: boolean; partialMatches: string[]; nameWordMatches: string[] } {
  const nameWords = emojiName.toLowerCase().split(/\s+/)
  const exactMatch = inputWords.length === nameWords.length && inputWords.every((word) => nameWords.includes(word))

  // Find input words that exactly match name words
  const nameWordMatches = inputWords.filter((word) => nameWords.includes(word))

  // Find input words that are substrings of the emoji name (broader matching)
  const partialMatches = inputWords.filter((word) => emojiName.toLowerCase().includes(word) && word.length >= 3)

  return { exactMatch, partialMatches, nameWordMatches }
}

export function findBestEmojiMatches(text: string, maxResults = 5): EmojiMatch[] {
  if (!text || typeof text !== "string") {
    return [
      {
        emoji: "😊",
        name: "smiling face with smiling eyes",
        matchPercentage: 100,
        matchedKeywords: ["default"],
        category: "emotion",
        semanticScore: 100,
        contextScore: 0,
      },
    ]
  }

  const originalText = text.trim()
  const containedEmojis = extractEmojisFromText(originalText)
  const textWithoutEmojis = removeEmojisFromText(originalText)
  const lowerText = textWithoutEmojis.toLowerCase()

  // Only 100% match if input exactly matches emoji name
  const exactNameMatches = emojiDatabase.filter((emoji) => emoji.name.toLowerCase() === lowerText)

  if (exactNameMatches.length > 0) {
    // For exact matches, find truly related emojis based on the search context
    const alternatives = findRelatedEmojis(exactNameMatches[0], lowerText, 4)

    const exactMatch = {
      emoji: exactNameMatches[0].emoji,
      name: exactNameMatches[0].name,
      matchPercentage: 100,
      matchedKeywords: [exactNameMatches[0].name],
      category: exactNameMatches[0].category,
      semanticScore: 100,
      contextScore: 0,
    }

    return [exactMatch, ...alternatives].slice(0, maxResults)
  }

  // Handle single letter inputs
  if (lowerText.length === 1 && /^[a-z]$/.test(lowerText)) {
    const letterMatch = letterEmojis.find((emoji) =>
      emoji.keywords.some((keyword) => keyword === lowerText || keyword === `letter ${lowerText}`),
    )

    if (letterMatch) {
      return [
        {
          emoji: letterMatch.emoji,
          name: letterMatch.name,
          matchPercentage: 100,
          matchedKeywords: [lowerText],
          category: letterMatch.category,
          semanticScore: 100,
          contextScore: 0,
        },
      ]
    }
  }

  // Handle special letter combinations
  if (lowerText === "ab" || lowerText === "a b") {
    const abMatch = letterEmojis.find((emoji) => emoji.emoji === "🆎")
    if (abMatch) {
      return [
        {
          emoji: abMatch.emoji,
          name: abMatch.name,
          matchPercentage: 100,
          matchedKeywords: ["ab"],
          category: abMatch.category,
          semanticScore: 100,
          contextScore: 0,
        },
      ]
    }
  }

  const words = lowerText.split(/\s+/).filter((word) => word.length > 1)
  const wordsNoStopWords = removeStopWords(words)
  const analysis = analyzeText(lowerText, words, wordsNoStopWords, containedEmojis)

  const allMatches: EmojiMatch[] = []

  // Score each emoji with enhanced name-priority matching
  for (const emojiData of emojiDatabase) {
    const matchResult = calculateNamePriorityMatchScore(analysis, emojiData, lowerText, words)

    // Apply emoji presence bonus
    if (containedEmojis.includes(emojiData.emoji)) {
      matchResult.totalScore = Math.min(100, matchResult.totalScore + 50) // Big bonus for contained emojis
      matchResult.matchedKeywords.push("emoji in text")
    }

    if (matchResult.totalScore > 0) {
      allMatches.push({
        emoji: emojiData.emoji,
        name: emojiData.name,
        matchPercentage: Math.round(matchResult.totalScore),
        matchedKeywords: matchResult.matchedKeywords,
        category: emojiData.category,
        semanticScore: Math.round(matchResult.semanticScore),
        contextScore: Math.round(matchResult.contextScore),
      })
    }
  }

  // Sort by match percentage (descending)
  allMatches.sort((a, b) => b.matchPercentage - a.matchPercentage)

  // If we have fewer than maxResults, try to find more matches using related keywords
  if (allMatches.length < maxResults && allMatches.length > 0) {
    const additionalMatches = findAdditionalMatches(allMatches, words, maxResults - allMatches.length)
    allMatches.push(...additionalMatches)
  }

  // Apply diversity penalties to avoid too many similar scores
  const diversifiedMatches = applyDiversityScoring(allMatches)

  // If no matches found, return default
  if (diversifiedMatches.length === 0) {
    return [
      {
        emoji: "😊",
        name: "smiling face with smiling eyes",
        matchPercentage: 0,
        matchedKeywords: [],
        category: "emotion",
        semanticScore: 0,
        contextScore: 0,
      },
    ]
  }

  return diversifiedMatches.slice(0, maxResults)
}

function findAdditionalMatches(existingMatches: EmojiMatch[], inputWords: string[], needed: number): EmojiMatch[] {
  if (existingMatches.length === 0) return []

  const additional: EmojiMatch[] = []
  const existingEmojis = new Set(existingMatches.map((m) => m.emoji))
  const topMatch = existingMatches[0]

  // Find emojis that share keywords with the top match
  const topMatchEmoji = emojiDatabase.find((e) => e.emoji === topMatch.emoji)
  if (!topMatchEmoji) return []

  // Get related keywords from the top match
  const relatedKeywords = new Set(topMatchEmoji.keywords)

  // Also add category-related keywords
  const categoryEmojis = emojiDatabase.filter(
    (e) => e.category === topMatchEmoji.category && !existingEmojis.has(e.emoji),
  )

  // Score potential additional matches
  const candidates: Array<{ emoji: EmojiData; score: number; reason: string[] }> = []

  for (const emoji of emojiDatabase) {
    if (existingEmojis.has(emoji.emoji)) continue

    let score = 0
    const reasons: string[] = []

    // Check for shared keywords with top match
    const sharedKeywords = emoji.keywords.filter((k) => relatedKeywords.has(k))
    if (sharedKeywords.length > 0) {
      score += sharedKeywords.length * 15
      reasons.push(`related: ${sharedKeywords.slice(0, 2).join(", ")}`)
    }

    // Same category bonus
    if (emoji.category === topMatchEmoji.category) {
      score += 10
      reasons.push("same category")
    }

    // Check if any input words appear in this emoji's keywords
    const inputMatches = emoji.keywords.filter((k) => inputWords.some((w) => k.includes(w) || w.includes(k)))
    if (inputMatches.length > 0) {
      score += inputMatches.length * 20
      reasons.push(`input match: ${inputMatches.slice(0, 2).join(", ")}`)
    }

    // Name similarity with input words
    const nameWords = emoji.name.toLowerCase().split(/\s+/)
    const nameMatches = inputWords.filter((w) => nameWords.some((nw) => nw.includes(w) || w.includes(nw)))
    if (nameMatches.length > 0) {
      score += nameMatches.length * 25
      reasons.push(`name match: ${nameMatches.join(", ")}`)
    }

    if (score > 0) {
      candidates.push({ emoji, score, reason: reasons })
    }
  }

  // Sort by score and take top candidates
  candidates.sort((a, b) => b.score - a.score)

  for (let i = 0; i < Math.min(needed, candidates.length); i++) {
    const candidate = candidates[i]
    const baseScore = Math.min(topMatch.matchPercentage - 10, 75) // Start lower than top match
    const matchPercentage = Math.max(15, baseScore - i * 8) // Decreasing percentages

    additional.push({
      emoji: candidate.emoji.emoji,
      name: candidate.emoji.name,
      matchPercentage,
      matchedKeywords: candidate.reason,
      category: candidate.emoji.category,
      semanticScore: matchPercentage,
      contextScore: 0,
    })
  }

  return additional
}

function findRelatedEmojis(exactMatch: EmojiData, searchText: string, count: number): EmojiMatch[] {
  const related: EmojiMatch[] = []

  // Score all other emojis based on their relationship to the exact match
  const candidates: Array<{ emoji: EmojiData; score: number; reason: string[] }> = []

  for (const emoji of emojiDatabase) {
    if (emoji.emoji === exactMatch.emoji) continue

    let score = 0
    const reasons: string[] = []

    // 1. Shared keywords (highest priority)
    const sharedKeywords = emoji.keywords.filter((keyword) => exactMatch.keywords.includes(keyword))
    if (sharedKeywords.length > 0) {
      score += sharedKeywords.length * 25
      reasons.push(`shared: ${sharedKeywords.slice(0, 2).join(", ")}`)
    }

    // 2. Same category (medium priority)
    if (emoji.category === exactMatch.category) {
      score += 15
      reasons.push("same category")
    }

    // 3. Name similarity (check if names share words)
    const exactNameWords = exactMatch.name.toLowerCase().split(/\s+/)
    const emojiNameWords = emoji.name.toLowerCase().split(/\s+/)
    const sharedNameWords = exactNameWords.filter((word) => emojiNameWords.includes(word))
    if (sharedNameWords.length > 0) {
      score += sharedNameWords.length * 20
      reasons.push(`name similarity: ${sharedNameWords.join(", ")}`)
    }

    // 4. Keyword overlap with search context
    const searchWords = searchText.toLowerCase().split(/\s+/)
    const contextMatches = emoji.keywords.filter((keyword) => searchWords.includes(keyword))
    if (contextMatches.length > 0) {
      score += contextMatches.length * 10
      reasons.push(`context: ${contextMatches.slice(0, 2).join(", ")}`)
    }

    if (score > 0) {
      candidates.push({ emoji, score, reason: reasons })
    }
  }

  // Sort by score and take top candidates
  candidates.sort((a, b) => b.score - a.score)

  for (let i = 0; i < Math.min(count, candidates.length); i++) {
    const candidate = candidates[i]
    const matchPercentage = Math.max(20, Math.min(85, candidate.score - i * 10)) // Decreasing percentages

    related.push({
      emoji: candidate.emoji.emoji,
      name: candidate.emoji.name,
      matchPercentage,
      matchedKeywords: candidate.reason,
      category: candidate.emoji.category,
      semanticScore: matchPercentage,
      contextScore: 0,
    })
  }

  return related
}

function calculateNamePriorityMatchScore(
  analysis: MatchAnalysis,
  emojiData: EmojiData,
  fullText: string,
  inputWords: string[],
): {
  totalScore: number
  semanticScore: number
  contextScore: number
  matchedKeywords: string[]
} {
  let baseScore = 0
  let semanticScore = 0
  let contextScore = 0
  const matchedKeywords: string[] = []

  // 1. HIGHEST PRIORITY: Emoji name matching
  const nameMatches = getEmojiNameMatches(emojiData.name, inputWords)

  if (nameMatches.exactMatch) {
    // This should only happen if input exactly matches name (handled earlier)
    baseScore += 100
    matchedKeywords.push("exact name match")
  } else if (nameMatches.nameWordMatches.length > 0) {
    // Input words that exactly match name words - HIGHEST PRIORITY
    const nameWordScore = nameMatches.nameWordMatches.length * 50 // Very high score for exact name word matches
    baseScore += nameWordScore
    matchedKeywords.push(...nameMatches.nameWordMatches.map((w) => `name word: ${w}`))
  } else if (nameMatches.partialMatches.length > 0) {
    // Name contains input words as substrings - HIGH PRIORITY
    const nameSubstringScore = nameMatches.partialMatches.length * 35 // High score for name substring matches
    baseScore += nameSubstringScore
    matchedKeywords.push(...nameMatches.partialMatches.map((w) => `name contains: ${w}`))
  }

  // 2. MEDIUM PRIORITY: Keyword matching (only if no strong name match)
  const nameMatchStrength = nameMatches.partialMatches.length * 40

  for (const keyword of emojiData.keywords) {
    let keywordScore = 0

    // Exact word match in input
    if (inputWords.includes(keyword)) {
      keywordScore = 30 // Lower than name matches
      matchedKeywords.push(keyword)
    }
    // Full text exact match
    else if (fullText === keyword) {
      keywordScore = 30
      if (!matchedKeywords.includes(keyword)) {
        matchedKeywords.push(keyword)
      }
    }
    // Full text contains keyword as complete word
    else {
      try {
        const escapedKeyword = escapeRegExp(keyword)
        const wordBoundaryRegex = new RegExp(`\\b${escapedKeyword}\\b`, "i")
        if (wordBoundaryRegex.test(fullText)) {
          keywordScore = 25
          if (!matchedKeywords.includes(keyword)) {
            matchedKeywords.push(keyword)
          }
        }
      } catch (regexError) {
        // Fallback to simple includes if regex fails
        if (fullText.includes(keyword)) {
          keywordScore = 20
          if (!matchedKeywords.includes(keyword)) {
            matchedKeywords.push(keyword)
          }
        }
      }
    }

    // Partial matches with heavy penalty
    if (keywordScore === 0 && keyword.length >= 4) {
      for (const word of inputWords) {
        // Input word is a substring of keyword (like "bell" in "belly")
        if (keyword.includes(word) && word.length >= 3) {
          const matchRatio = word.length / keyword.length
          keywordScore = Math.round(15 * Math.pow(matchRatio, 2)) // Heavy penalty
          if (!matchedKeywords.includes(keyword)) {
            matchedKeywords.push(`partial: ${keyword}`)
          }
          break
        }
        // Keyword is a substring of input word
        else if (word.includes(keyword)) {
          const matchRatio = keyword.length / word.length
          keywordScore = Math.round(20 * Math.pow(matchRatio, 1.5))
          if (!matchedKeywords.includes(keyword)) {
            matchedKeywords.push(`contains: ${keyword}`)
          }
          break
        }
      }
    }

    // If we have strong name matches, reduce keyword influence
    if (nameMatchStrength > 40) {
      keywordScore *= 0.5
    }

    baseScore += keywordScore
  }

  // 3. Multi-word bonus: if multiple input words match different parts
  const uniqueMatchedWords = new Set()
  for (const keyword of matchedKeywords) {
    for (const word of inputWords) {
      if (keyword.includes(word) || word.includes(keyword) || keyword === word) {
        uniqueMatchedWords.add(word)
      }
    }
  }

  // Bonus for matching multiple input words
  if (uniqueMatchedWords.size > 1) {
    const multiWordBonus = (uniqueMatchedWords.size - 1) * 10
    baseScore += multiWordBonus
    semanticScore += 5
  }

  // 4. Calculate additional scores
  semanticScore += calculateSemanticScore(fullText, analysis, emojiData, matchedKeywords, false)
  contextScore = calculateContextScore(analysis, emojiData, false)

  // 5. Apply context validation
  const contextValidation = validateSemanticContext(analysis, emojiData, matchedKeywords)
  semanticScore *= contextValidation

  // 6. Combine scores with adjusted weights (prioritize base score from names)
  let totalScore = baseScore * 0.85 + semanticScore * 0.1 + contextScore * 0.05

  // 7. Apply penalties for poor context
  if (contextValidation < 0.5 && semanticScore > 20) {
    totalScore *= 0.6
  }

  totalScore = Math.min(100, totalScore)

  return {
    totalScore,
    semanticScore,
    contextScore,
    matchedKeywords,
  }
}

function applyDiversityScoring(matches: EmojiMatch[]): EmojiMatch[] {
  if (matches.length <= 1) return matches

  const diversified = [matches[0]] // Keep the best match as-is

  for (let i = 1; i < matches.length; i++) {
    const match = { ...matches[i] }

    // Apply penalties based on position and similarity to previous matches
    const positionPenalty = Math.floor(i * 2) // 2% penalty per position
    const similarityPenalty = calculateSimilarityPenalty(match, diversified)

    match.matchPercentage = Math.max(0, match.matchPercentage - positionPenalty - similarityPenalty)

    if (match.matchPercentage > 0) {
      diversified.push(match)
    }
  }

  return diversified
}

function calculateSimilarityPenalty(match: EmojiMatch, existingMatches: EmojiMatch[]): number {
  let penalty = 0

  for (const existing of existingMatches) {
    // Same category penalty (reduced)
    if (match.category === existing.category) {
      penalty += 3
    }

    // Similar keywords penalty (reduced)
    const sharedKeywords = match.matchedKeywords.filter((keyword) => existing.matchedKeywords.includes(keyword)).length

    if (sharedKeywords > 0) {
      penalty += sharedKeywords * 4
    }

    // Similar match percentage penalty
    const scoreDiff = Math.abs(match.matchPercentage - existing.matchPercentage)
    if (scoreDiff < 3) {
      penalty += 6
    }
  }

  return Math.min(penalty, 25) // Cap penalty at 25%
}

// Keep the original function for backward compatibility
export function findBestEmojiMatch(text: string): EmojiMatch {
  const matches = findBestEmojiMatches(text, 1)
  return matches[0]
}

function analyzeText(
  text: string,
  words: string[],
  wordsNoStopWords: string[],
  containedEmojis: string[],
): MatchAnalysis {
  const positiveWords = [
    "happy",
    "joy",
    "smile",
    "laugh",
    "love",
    "excited",
    "amazing",
    "wonderful",
    "great",
    "awesome",
    "good",
    "fantastic",
    "brilliant",
    "cheerful",
    "delighted",
    "fun",
    "awesome",
    "excellent",
    "perfect",
    "beautiful",
  ]

  const negativeWords = [
    "sad",
    "cry",
    "angry",
    "mad",
    "upset",
    "disappointed",
    "frustrated",
    "hurt",
    "pain",
    "terrible",
    "awful",
    "bad",
    "hate",
    "depressed",
    "miserable",
    "angry",
    "furious",
    "annoyed",
    "worried",
    "scared",
  ]

  const questionWords = ["what", "how", "why", "when", "where", "who", "which", "can", "could", "would", "should"]

  // Create word position map for both versions
  const wordPositions = new Map<string, number[]>()
  words.forEach((word, index) => {
    if (!wordPositions.has(word)) {
      wordPositions.set(word, [])
    }
    wordPositions.get(word)!.push(index)
  })

  // Calculate word proximity pairs
  const proximityPairs: Array<{ word1: string; word2: string; distance: number }> = []
  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j < words.length; j++) {
      proximityPairs.push({
        word1: words[i],
        word2: words[j],
        distance: j - i,
      })
    }
  }

  let sentiment: "positive" | "negative" | "neutral" | "question" = "neutral"

  // Determine sentiment
  if (text.includes("?") || questionWords.some((word) => words.includes(word))) {
    sentiment = "question"
  } else {
    const positiveCount = positiveWords.filter((word) => text.includes(word)).length
    const negativeCount = negativeWords.filter((word) => text.includes(word)).length

    if (negativeCount > positiveCount) {
      sentiment = "negative"
    } else if (positiveCount > 0) {
      sentiment = "positive"
    }
  }

  return {
    directMatches: [],
    partialMatches: [],
    semanticMatches: [],
    contextWords: words,
    contextWordsNoStopWords: wordsNoStopWords,
    containedEmojis,
    sentiment,
    wordPositions,
    proximityPairs,
  }
}

function validateSemanticContext(analysis: MatchAnalysis, emojiData: EmojiData, matchedKeywords: string[]): number {
  // Check if semantic combinations make sense in context
  let validationScore = 1.0

  // For cat emotion combinations, check if emotion words are actually present and contextually related
  if (emojiData.emoji === "😿") {
    const hasSadWord = analysis.contextWords.some((word) => ["sad", "cry", "crying", "tears", "upset"].includes(word))
    const hasCatWord = analysis.contextWords.some((word) => ["cat", "kitten", "meow"].includes(word))

    if (hasCatWord && hasSadWord) {
      const sadCatProximity = analysis.proximityPairs.find(
        (pair) =>
          (["sad", "cry", "crying"].includes(pair.word1) && ["cat", "kitten", "meow"].includes(pair.word2)) ||
          (["sad", "cry", "crying"].includes(pair.word2) && ["cat", "kitten", "meow"].includes(pair.word1)),
      )

      if (sadCatProximity && sadCatProximity.distance <= 3) {
        validationScore = 1.0
      } else if (sadCatProximity) {
        validationScore = 0.7
      } else {
        validationScore = 0.3
      }
    } else if (hasCatWord || hasSadWord) {
      validationScore = 0.4
    } else {
      validationScore = 0.1
    }
  }

  // Check for conflicting context
  const hasConflictingWords = checkForConflictingContext(analysis, emojiData)
  if (hasConflictingWords) {
    validationScore *= 0.5
  }

  return validationScore
}

function checkForConflictingContext(analysis: MatchAnalysis, emojiData: EmojiData): boolean {
  const conflictMap: Record<string, string[]> = {
    "😿": ["happy", "joy", "excited", "ice", "cold", "freeze"],
    "😾": ["happy", "love", "peaceful", "ice", "cold"],
    "😻": ["sad", "angry", "hate", "ice", "cold"],
    "🙀": ["calm", "peaceful", "ice", "cold"],
  }

  const conflicts = conflictMap[emojiData.emoji] || []
  return analysis.contextWords.some((word) => conflicts.includes(word))
}

function calculateSemanticScore(
  text: string,
  analysis: MatchAnalysis,
  emojiData: EmojiData,
  matchedKeywords: string[],
  useStopWordFiltering: boolean,
): number {
  let score = 0

  // Sentiment-based scoring with more variation
  if (analysis.sentiment === "positive" && emojiData.category === "emotion") {
    const positiveEmojis = ["😊", "😃", "😄", "😁", "🥰", "😍", "🤩", "😘"]
    if (positiveEmojis.includes(emojiData.emoji)) {
      score += 25
    }
  }

  if (analysis.sentiment === "negative" && emojiData.category === "emotion") {
    const negativeEmojis = ["😢", "😭", "😞", "😔", "😟", "😕", "😠", "😡"]
    if (negativeEmojis.includes(emojiData.emoji)) {
      score += 25
    }
  }

  if (analysis.sentiment === "question") {
    const questionEmojis = ["🤔", "❓", "🤷"]
    if (questionEmojis.includes(emojiData.emoji)) {
      score += 30
    }
  }

  // Category relevance bonus
  const wordsToUse = useStopWordFiltering ? analysis.contextWordsNoStopWords : analysis.contextWords
  if (wordsToUse.length > 0) {
    const categoryKeywords = {
      food: ["eat", "food", "hungry", "delicious", "taste", "cook", "meal"],
      animal: ["pet", "wild", "zoo", "cute", "furry"],
      emotion: ["feel", "emotion", "mood", "happy", "sad"],
      travel: ["trip", "vacation", "journey", "travel", "visit"],
      sport: ["game", "play", "team", "win", "score"],
    }

    const relevantWords = categoryKeywords[emojiData.category as keyof typeof categoryKeywords] || []
    const categoryMatches = wordsToUse.filter((word) => relevantWords.includes(word)).length
    score += categoryMatches * 15
  }

  return score
}

function calculateContextScore(analysis: MatchAnalysis, emojiData: EmojiData, useStopWordFiltering: boolean): number {
  let score = 0

  const wordsToUse = useStopWordFiltering ? analysis.contextWordsNoStopWords : analysis.contextWords
  const wordCount = wordsToUse.length

  if (wordCount === 1) {
    score += 20 // Single word should strongly favor direct matches
  } else if (wordCount === 2) {
    score += 15
  } else if (wordCount === 3) {
    score += 10
  } else if (wordCount > 3) {
    score += 5 // Longer phrases get smaller bonus
  }

  return score
}
