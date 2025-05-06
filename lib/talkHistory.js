const ScheduledSpeaker = require('../models/scheduledSpeaker')
const { completion } = require('./llm')

/**
 * Get all talks from the database
 * @returns {Promise<Array>} Array of all talks
 */
async function getAllTalks () {
  return await ScheduledSpeaker.find().sort({ scheduledDate: -1 })
}

/**
 * Query talks based on a topic using LLM for matching
 * @param {string} query - The user's query about talks
 * @returns {Promise<Array>} Array of matching talks
 */
async function queryTalks (query) {
  const talks = await getAllTalks()

  if (talks.length === 0) {
    return []
  }

  // Prepare context for LLM with all fields from the model
  const talksContext = talks.map(talk => ({
    discordUserId: talk.discordUserId,
    discordUsername: talk.discordUsername,
    topic: talk.topic,
    scheduledDate: talk.scheduledDate,
    bookingTimestamp: talk.bookingTimestamp,
    threadId: talk.threadId
  }))

  // Use LLM to determine which talks match the query
  const prompt = `You are an assistant helping match user queries to relevant talks. Your primary focus should be on matching the topic of the talks.

Given the following list of talks and a user query, identify which talks are relevant to the query by focusing on the topic field. Consider semantic similarity and related concepts.

User Query: "${query}"

Talks:
${JSON.stringify(talksContext, null, 2)}

Return a JSON array of indices (0-based) of the talks that match the query. If no talks match, return an empty array.
Focus on matching the topic field, but also consider the context of the query.`

  const llmResponse = await completion({
    systemMessage: 'You are an assistant helping match user queries to relevant talks. Return ONLY a JSON array of indices. Focus on matching the topic field.',
    prompt
  })

  try {
    // Extract JSON from markdown code block if present
    const jsonMatch = llmResponse.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/) || [null, llmResponse]
    const jsonStr = jsonMatch[1].trim()
    const matchingIndices = JSON.parse(jsonStr)
    return matchingIndices.map(index => talks[index])
  } catch (error) {
    console.error('Error parsing LLM response:', error)
    return []
  }
}

/**
 * Format a talk for display
 * @param {Object} talk - The talk object
 * @returns {string} Formatted talk information
 */
function formatTalk (talk) {
  return `**${talk.topic}**\n` +
         `Speaker: ${talk.discordUsername} \n` +
         `Date: ${talk.scheduledDate.toLocaleDateString()}\n` +
         `Booked on: ${talk.bookingTimestamp.toLocaleDateString()}\n`
}

module.exports = {
  getAllTalks,
  queryTalks,
  formatTalk
}
