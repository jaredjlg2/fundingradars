import { PrismaClient } from '@prisma/client';
import { DEFAULT_WEIGHTS } from '../src/types';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await prisma.customer.createMany({
    data: [
      {
        organizationName: 'BuildRight Federal Contractors LLC',
        contactName: 'Sarah Johnson',
        email: 'sarah@buildright.example.com',
        customerType: 'SMALL_BUSINESS',
        keywordsInclude: ['construction', 'infrastructure', 'facilities', 'renovation', 'maintenance'],
        keywordsExclude: ['defense', 'military', 'classified'],
        naicsCodes: ['236220', '237310', '238990'],
        agenciesOfInterest: ['General Services Administration', 'Army Corps of Engineers'],
        locationsOfInterest: ['Virginia', 'Maryland', 'District of Columbia'],
        setAsidePreferences: ['SMALL_BUSINESS', '8A', 'SBA'],
        minAwardAmount: 50000,
        maxAwardAmount: 5000000,
        weeklyDigestDay: 1,
        notes: 'Focus on mid-Atlantic region federal construction contracts',
      },
      {
        organizationName: 'Community First Nonprofit Network',
        contactName: 'Marcus Williams',
        email: 'marcus@communityfirst.example.com',
        customerType: 'NONPROFIT',
        keywordsInclude: ['education', 'community', 'youth', 'social services', 'workforce', 'training'],
        keywordsExclude: ['defense', 'military'],
        naicsCodes: ['624110', '624120', '611710'],
        agenciesOfInterest: ['Department of Education', 'Department of Health and Human Services'],
        locationsOfInterest: ['Ohio', 'Michigan', 'Indiana'],
        setAsidePreferences: [],
        maxAwardAmount: 2000000,
        weeklyDigestDay: 2,
        notes: 'Seeking federal grants for nonprofit education and community programs',
      },
      {
        organizationName: 'Riverside County Government',
        contactName: 'Linda Chen',
        email: 'lchen@riversidecounty.example.gov',
        customerType: 'GOVERNMENT',
        keywordsInclude: ['public works', 'transportation', 'emergency management', 'infrastructure', 'safety'],
        keywordsExclude: [],
        naicsCodes: ['237310', '237130', '922160'],
        agenciesOfInterest: ['Department of Transportation', 'FEMA', 'Department of Homeland Security'],
        locationsOfInterest: ['California'],
        setAsidePreferences: [],
        minAwardAmount: 100000,
        weeklyDigestDay: 3,
        notes: 'Local government seeking state and federal infrastructure and emergency management funds',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.appSetting.upsert({
    where: { key: 'MATCH_THRESHOLD' },
    update: { valueJson: 50 },
    create: { key: 'MATCH_THRESHOLD', valueJson: 50 },
  });

  await prisma.appSetting.upsert({
    where: { key: 'SCORING_WEIGHTS' },
    update: { valueJson: DEFAULT_WEIGHTS as unknown as Record<string, number> },
    create: { key: 'SCORING_WEIGHTS', valueJson: DEFAULT_WEIGHTS as unknown as Record<string, number> },
  });

  console.log('Seed complete.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
