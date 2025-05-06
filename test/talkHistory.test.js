const test = require('tape')
const mongoose = require('../lib/mongo')
const ScheduledSpeaker = require('../models/scheduledSpeaker')
const { getAllTalks, queryTalks, formatTalk } = require('../lib/talkHistory')
const llm = require('../lib/llm')

// Helper function to create a test talk
function createTestTalk (overrides = {}) {
  const defaultTalk = {
    discordUserId: 'test-user',
    discordUsername: 'TestUser',
    topic: 'Test Topic',
    scheduledDate: new Date(),
    bookingTimestamp: new Date(),
    threadId: 'test-thread'
  }
  return { ...defaultTalk, ...overrides }
}

test('talkHistory - getAllTalks - empty database', async (t) => {
  await ScheduledSpeaker.deleteMany({}) // Clean slate
  const talks = await getAllTalks()
  t.deepEqual(talks, [], 'should return empty array when no talks exist')
  t.end()
})

test('talkHistory - getAllTalks - multiple talks', async (t) => {
  await ScheduledSpeaker.deleteMany({}) // Clean slate

  // Create test talks with different dates
  const talk1 = createTestTalk({
    topic: 'First Talk',
    scheduledDate: new Date('2024-01-01')
  })
  const talk2 = createTestTalk({
    topic: 'Second Talk',
    scheduledDate: new Date('2024-02-01')
  })
  const talk3 = createTestTalk({
    topic: 'Third Talk',
    scheduledDate: new Date('2024-03-01')
  })

  await ScheduledSpeaker.insertMany([talk1, talk2, talk3])

  const talks = await getAllTalks()

  t.equal(talks.length, 3, 'should return all talks')
  t.equal(talks[0].topic, 'Third Talk', 'should be sorted by date descending')
  t.equal(talks[1].topic, 'Second Talk', 'should be sorted by date descending')
  t.equal(talks[2].topic, 'First Talk', 'should be sorted by date descending')

  await ScheduledSpeaker.deleteMany({}) // Cleanup
  t.end()
})

test('talkHistory - queryTalks - no talks', async (t) => {
  await ScheduledSpeaker.deleteMany({}) // Clean slate
  const results = await queryTalks('any query')
  t.deepEqual(results, [], 'should return empty array when no talks exist')
  t.end()
})

test('talkHistory - queryTalks - matching talks', async (t) => {
  await ScheduledSpeaker.deleteMany({}) // Clean slate

  // Create test talks with different topics
  const talk1 = createTestTalk({
    topic: 'Introduction to Machine Learning',
    scheduledDate: new Date('2024-01-01')
  })
  const talk2 = createTestTalk({
    topic: 'Deep Learning Basics',
    scheduledDate: new Date('2024-02-01')
  })
  const talk3 = createTestTalk({
    topic: 'Web Development with React',
    scheduledDate: new Date('2024-03-01')
  })

  await ScheduledSpeaker.insertMany([talk1, talk2, talk3])

  // Save original completion function
  const originalCompletion = llm.completion

  // Mock completion function
  llm.completion = async () => '```json\n[0, 1]\n```'

  const results = await queryTalks('machine learning')

  t.equal(results.length, 2, 'should return exactly two matching results')
  t.ok(results.some(talk => talk.topic === 'Introduction to Machine Learning'), 'should include Introduction to Machine Learning')
  t.ok(results.some(talk => talk.topic === 'Deep Learning Basics'), 'should include Deep Learning Basics')

  // Verify each result has the expected structure
  results.forEach(talk => {
    t.ok(talk.topic, 'each result should have a topic')
    t.ok(talk.discordUsername, 'each result should have a username')
    t.ok(talk.scheduledDate instanceof Date, 'each result should have a date')
  })

  // Restore original completion function
  llm.completion = originalCompletion

  await ScheduledSpeaker.deleteMany({}) // Cleanup
  t.end()
})

test('talkHistory - formatTalk', (t) => {
  const talk = createTestTalk({
    topic: 'Test Topic',
    discordUsername: 'TestUser',
    scheduledDate: new Date('2024-01-01'),
    bookingTimestamp: new Date('2024-01-01')
  })

  const formatted = formatTalk(talk)

  t.ok(formatted.includes('Test Topic'), 'should include topic')
  t.ok(formatted.includes('TestUser'), 'should include username')
  t.ok(formatted.includes('**'), 'should format topic in bold')

  // Check date formatting more robustly
  const dateRegex = /\d{1,2}\/\d{1,2}\/\d{4}/ // Matches MM/DD/YYYY or DD/MM/YYYY
  t.ok(dateRegex.test(formatted), 'should include properly formatted dates')

  t.end()
})
