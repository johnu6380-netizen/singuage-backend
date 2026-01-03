// prisma/seed.ts
// Seed database with initial data

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample grammar concepts for Spanish
  const grammarConcepts = await Promise.all([
    prisma.grammarConcept.create({
      data: {
        conceptSlug: 'spanish_present_simple',
        conceptName: 'Present Simple Tense',
        language: 'es',
        shortExplanation:
          'Used to describe habits, facts, and general truths. Regular verbs follow patterns: -ar → -o/-as/-a, -er → -o/-es/-e, -ir → -o/-es/-e.',
        detailedExplanation:
          'The present simple (presente simple) is one of the most common tenses in Spanish. It is used to describe actions that happen regularly, facts, and general truths. Regular verbs are conjugated by removing the infinitive ending (-ar, -er, -ir) and adding specific endings based on the subject.',
        examples: [
          {
            sentence: 'Yo hablo español',
            translation: 'I speak Spanish',
            highlight: 'hablo',
            explanation: 'Regular -ar verb conjugation for "yo" (I)',
          },
          {
            sentence: 'Ella come frutas',
            translation: 'She eats fruits',
            highlight: 'come',
            explanation: 'Regular -er verb conjugation for "ella" (she)',
          },
          {
            sentence: 'Nosotros vivimos en Madrid',
            translation: 'We live in Madrid',
            highlight: 'vivimos',
            explanation: 'Regular -ir verb conjugation for "nosotros" (we)',
          },
        ],
        category: 'verb_tenses',
        difficultyLevel: 1,
        isPublished: true,
      },
    }),
    prisma.grammarConcept.create({
      data: {
        conceptSlug: 'spanish_preterite',
        conceptName: 'Preterite Tense (Past)',
        language: 'es',
        shortExplanation:
          'Used for completed actions in the past. Regular verbs: -ar → -é/-aste/-ó, -er/-ir → -í/-iste/-ió.',
        detailedExplanation:
          'The preterite tense (pretérito) is used to talk about actions that were completed at a specific time in the past. It is often used for events that happened once or a specific number of times.',
        examples: [
          {
            sentence: 'Bailé toda la noche',
            translation: 'I danced all night',
            highlight: 'Bailé',
            explanation: 'Completed action in the past',
          },
          {
            sentence: 'Comimos pizza ayer',
            translation: 'We ate pizza yesterday',
            highlight: 'Comimos',
            explanation: 'Specific past event with time marker',
          },
        ],
        category: 'verb_tenses',
        difficultyLevel: 2,
        prerequisiteConcepts: ['spanish_present_simple'],
        isPublished: true,
      },
    }),
    prisma.grammarConcept.create({
      data: {
        conceptSlug: 'spanish_ser_vs_estar',
        conceptName: 'Ser vs Estar',
        language: 'es',
        shortExplanation:
          'Both mean "to be" but used differently. Ser: permanent states, identity. Estar: temporary states, location.',
        detailedExplanation:
          'Spanish has two verbs for "to be": ser and estar. Ser is used for permanent characteristics, identity, origin, and time. Estar is used for temporary states, emotions, location, and progressive tenses.',
        examples: [
          {
            sentence: 'Soy estudiante',
            translation: 'I am a student',
            highlight: 'Soy',
            explanation: 'Identity (permanent) - use SER',
          },
          {
            sentence: 'Estoy cansado',
            translation: 'I am tired',
            highlight: 'Estoy',
            explanation: 'Temporary state - use ESTAR',
          },
        ],
        category: 'verb_usage',
        difficultyLevel: 2,
        isPublished: true,
      },
    }),
  ]);

  console.log(`✅ Created ${grammarConcepts.length} grammar concepts`);

  // Create sample achievements
  const achievements = await Promise.all([
    prisma.achievement.create({
      data: {
        achievementKey: 'first_song',
        name: 'First Steps',
        description: 'Complete your first song',
        criteria: { type: 'songs_completed', threshold: 1 },
        rarity: 'common',
        xpReward: 50,
        isActive: true,
      },
    }),
    prisma.achievement.create({
      data: {
        achievementKey: 'streak_7',
        name: 'Week Warrior',
        description: 'Maintain a 7-day learning streak',
        criteria: { type: 'streak', days: 7 },
        rarity: 'rare',
        xpReward: 200,
        isActive: true,
      },
    }),
    prisma.achievement.create({
      data: {
        achievementKey: 'perfectionist',
        name: 'Perfectionist',
        description: 'Complete a song with 100% accuracy',
        criteria: { type: 'perfect_accuracy', threshold: 100 },
        rarity: 'epic',
        xpReward: 500,
        isActive: true,
      },
    }),
    prisma.achievement.create({
      data: {
        achievementKey: 'polyglot',
        name: 'Polyglot',
        description: 'Learn songs in 3 different languages',
        criteria: { type: 'languages_learned', threshold: 3 },
        rarity: 'legendary',
        xpReward: 1000,
        isActive: true,
      },
    }),
    prisma.achievement.create({
      data: {
        achievementKey: 'vocabulary_master',
        name: 'Vocabulary Master',
        description: 'Learn 100 new words',
        criteria: { type: 'vocabulary_size', threshold: 100 },
        rarity: 'rare',
        xpReward: 300,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${achievements.length} achievements`);

  console.log('✨ Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
