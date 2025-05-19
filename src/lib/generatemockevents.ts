/**
 * Script to generate 400 events for a PostgreSQL database based on Prisma schema
 * - 100 music concerts
 * - 100 sports events
 * - 100 corporate events
 * - 100 festivals
 * All in Kampala, Uganda with dates in August 2025
 * Includes embedding generation from title and description
 */

// Required libraries
import { Prisma } from "@prisma/client";
import prisma from "./prisma";
// For embedding generation
// Note: In a real production environment, you would use a proper embedding library.
// Here we'll show how to integrate with libraries like OpenAI's API or other embedding services

// Mock embedding function - in production, replace with actual API calls
// to services like OpenAI, Cohere, or other embedding providers

// Kampala, Uganda coordinates
const KAMPALA_LAT = 0.3476;
const KAMPALA_LONG = 32.5825;

// Function to generate a random date in August 2025
function randomAugust2025Date() {
    const day = Math.floor(Math.random() * 31) + 1; // 1-31
    const hour = Math.floor(Math.random() * 14) + 8; // 8 AM to 10 PM
    const minute = [0, 15, 30, 45][Math.floor(Math.random() * 4)]; // 0, 15, 30, or 45 minutes

    return new Date(2025, 7, day, hour, minute); // Note: month is 0-indexed, so 7 = August
}

// Function to generate slightly varied geolocations around Kampala
function randomKampalaLocation(): [number, number] {
    // Add a small random offset (±0.03 degrees) to create events spread around the city
    const latOffset = (Math.random() - 0.5) * 0.06;
    const longOffset = (Math.random() - 0.5) * 0.06;

    return [KAMPALA_LAT + latOffset, KAMPALA_LONG + longOffset];
}

// Arrays of event names by category
const musicEvents = [
    "Kampala Jazz Night", "Ugandan Beats Festival", "Afrobeats Explosion",
    "Classical Music Under Stars", "Rock Revolution Uganda", "Pearl of Africa Music Awards",
    "Hip Hop Kampala Showcase", "Acoustic Nights", "Opera at the National Theatre",
    "Electronic Dance Fest", "Gospel Celebration Concert", "Traditional Music Heritage Show",
    "Drumming Circle Live", "Symphony Orchestra Uganda", "Reggae Beach Party",
    "Pop Stars Tour", "Kampala Unplugged", "Music Legends Tribute",
    "New Artists Showcase", "Karaoke Championship Finals"
];

const sportsEvents = [
    "Uganda Premier League Match", "Kampala Marathon", "Rugby Championships",
    "Basketball Tournament Finals", "Cricket Cup", "Boxing Championship Night",
    "Swimming Competition", "Tennis Open Tournament", "Golf Classic Uganda",
    "Athletics Championship", "Volleyball Tournament", "Cycling Race Tour",
    "Motorsport Rally Uganda", "Handball Tournament", "Table Tennis Championships",
    "Horse Racing Cup", "Chess Championship", "Wrestling Tournament",
    "Yoga Competition", "Martial Arts Showcase"
];

const corporateEvents = [
    "Business Leaders Summit", "Tech Innovation Conference", "Marketing Masterclass",
    "Entrepreneurship Workshop", "Financial Markets Symposium", "HR Conference",
    "Digital Transformation Forum", "Startup Pitching Event", "CEO Roundtable",
    "Industry 4.0 Expo", "Supply Chain Management Conference", "Real Estate Investment Summit",
    "Banking Sector Conference", "Agricultural Business Forum", "Healthcare Industry Meeting",
    "Tourism Development Conference", "Mining Sector Symposium", "Telecommunications Summit",
    "Sustainability in Business Forum", "Trade and Export Conference"
];

const festivalEvents = [
    "Uganda Cultural Festival", "Food and Wine Festival", "Film Festival Kampala",
    "Arts and Crafts Fair", "International Dance Festival", "Literature Festival",
    "Kampala Fashion Week", "Children's Festival", "Comedy Festival",
    "Street Food Festival", "Heritage Celebration Days", "Innovation Festival",
    "Beer and Spirits Festival", "Agricultural Show", "Photography Exhibition",
    "Theater Festival", "International Cuisine Week", "Youth Festival",
    "Environmental Awareness Festival", "Traditional Games Festival"
];

// Venues by category
const musicVenues = [
    "Kampala Serena Hotel", "National Theatre", "Ndere Cultural Centre",
    "Lugogo Cricket Oval", "Sheraton Gardens", "Freedom City",
    "Kati Kati Restaurant", "Kampala Palace", "Theatre La Bonita", "Pearl of Africa Hotel"
];

const sportsVenues = [
    "Mandela National Stadium", "Lugogo Indoor Stadium", "MTN Arena Lugogo",
    "Namboole Stadium", "Kampala Rugby Grounds", "Makerere University Sports Grounds",
    "Kyadondo Rugby Club", "Lugogo Tennis Club", "Uganda Golf Club", "KCCA Stadium"
];

const corporateVenues = [
    "Speke Resort Munyonyo", "Kampala Serena Conference Centre", "Imperial Royale Hotel",
    "Sheraton Kampala Hotel", "Hotel Africana", "Golf Course Hotel",
    "Pearl of Africa Hotel", "Mestil Hotel", "Skyz Hotel Naguru", "Silver Springs Hotel"
];

const festivalVenues = [
    "Kololo Airstrip", "Uganda Museum", "Kampala Fair Grounds",
    "Independence Park", "Botanical Gardens", "Munyonyo Commonwealth Resort",
    "Lugogo Show Grounds", "Namboole Stadium Grounds", "Freedom City", "Uhuru Park"
];

// Generate variations of event names
function generateEventNames(baseNames: string[], count: number): string[] {
    const result = [];

    // First, use all the base names
    for (const baseName of baseNames) {
        result.push(baseName);
    }

    // Then generate variations until we reach the count
    let index = 0;
    while (result.length < count) {
        const baseName = baseNames[index % baseNames.length];
        const year = 2025;
        result.push(`${baseName} ${year}`);
        result.push(`Annual ${baseName}`);
        result.push(`${baseName} - Special Edition`);
        result.push(`${baseName} Showcase`);
        result.push(`The Ultimate ${baseName}`);
        index++;
    }

    return result.slice(0, count);
}

// Function to generate descriptions based on event type
function generateDescription(eventName: string, category: string): string {
    const commonStart = [
        "Join us for an unforgettable",
        "Don't miss this amazing",
        "Experience the best",
        "Be part of this exciting",
        "Kampala's premier"
    ];

    type CategorySpecific = {
        music: string[];
        sports: string[];
        corporate: string[];
        festivals: string[];
    };

    const categorySpecific: CategorySpecific = {
        music: [
            "Featuring top artists from across East Africa.",
            "Live performances that will leave you breathless.",
            "A night of exceptional musical talent.",
            "Bringing together diverse musical traditions.",
            "An acoustic experience like no other."
        ],
        sports: [
            "Watch top athletes compete for the championship.",
            "A display of skill, endurance and sportsmanship.",
            "Supporting local and international sports talents.",
            "The biggest sports event in Uganda this year.",
            "Competition at its finest in the heart of Kampala."
        ],
        corporate: [
            "Network with industry leaders and innovators.",
            "Gain insights from expert speakers and panels.",
            "Explore new business opportunities in Uganda.",
            "Professional development and learning at its best.",
            "Connecting businesses across East Africa."
        ],
        festivals: [
            "Celebrating Uganda's rich cultural heritage.",
            "A feast for the senses with something for everyone.",
            "Family-friendly activities throughout the day.",
            "Showcasing the best of Ugandan creativity.",
            "Bringing communities together in celebration."
        ]
    };

    const start = commonStart[Math.floor(Math.random() * commonStart.length)];
    const middle = ` ${category} event in Kampala. `;

    // Type assertion to ensure TypeScript knows category is a valid key
    const validCategory = category as keyof CategorySpecific;
    const categoryTexts = categorySpecific[validCategory];
    const end = categoryTexts[Math.floor(Math.random() * categoryTexts.length)];

    return `${start}${middle}${end} "${eventName}" will be held at the heart of Uganda's capital, bringing together people from all walks of life. Come and experience this unique event in August 2025.`;
}

// Generate metadata based on event category
function generateMetadata(category: string): Record<string, any> {
    const baseMetadata = {
        organizer: "",
        contactEmail: "",
        contactPhone: "+256",
        website: "",
        ticketPrice: "",
        ageRestriction: "",
        capacity: 0,
        category: category
    };

    // Define organizers with proper type
    type OrganizerMap = {
        music: string[];
        sports: string[];
        corporate: string[];
        festivals: string[];
    };

    // Organizers
    const organizers: OrganizerMap = {
        music: ["Uganda Music Association", "Beat Productions", "Swangz Avenue", "Pearl Artists", "Fenon Records"],
        sports: ["Uganda Sports Council", "National Sports Authority", "Kampala Sports Club", "Athletes United", "Sports Vision Uganda"],
        corporate: ["Uganda Business Forum", "East African Business Council", "Corporate Leaders Network", "Industry Innovators", "Business Uganda"],
        festivals: ["Cultural Heritage Foundation", "Festival Organizers Uganda", "Arts Council", "Kampala Events", "Heritage Productions"]
    };

    // Generate random phone number
    const phoneNum = Math.floor(Math.random() * 900000000) + 100000000;

    // Assign random values based on category with type assertion
    const validCategory = category as keyof OrganizerMap;
    const organizerList = organizers[validCategory];
    baseMetadata.organizer = organizerList[Math.floor(Math.random() * organizerList.length)];
    baseMetadata.contactEmail = `${baseMetadata.organizer.toLowerCase().replace(/\s+/g, '.')}@example.com`;
    baseMetadata.contactPhone += phoneNum.toString();
    baseMetadata.website = `https://www.${baseMetadata.organizer.toLowerCase().replace(/\s+/g, '')}.co.ug`;

    // Set category-specific values
    switch (category) {
        case 'music':
            baseMetadata.ticketPrice = `${Math.floor(Math.random() * 100000) + 50000} UGX`;
            baseMetadata.ageRestriction = Math.random() > 0.7 ? "18+" : "All ages";
            baseMetadata.capacity = Math.floor(Math.random() * 5000) + 1000;
            break;
        case 'sports':
            baseMetadata.ticketPrice = `${Math.floor(Math.random() * 80000) + 20000} UGX`;
            baseMetadata.ageRestriction = "All ages";
            baseMetadata.capacity = Math.floor(Math.random() * 10000) + 5000;
            break;
        case 'corporate':
            baseMetadata.ticketPrice = `${Math.floor(Math.random() * 500000) + 100000} UGX`;
            baseMetadata.ageRestriction = "Professional";
            baseMetadata.capacity = Math.floor(Math.random() * 500) + 100;
            break;
        case 'festivals':
            baseMetadata.ticketPrice = `${Math.floor(Math.random() * 50000) + 10000} UGX`;
            baseMetadata.ageRestriction = "All ages";
            baseMetadata.capacity = Math.floor(Math.random() * 8000) + 2000;
            break;
    }

    return baseMetadata;
}

// Generate image data
function generateImageData(category: string): Record<string, any> {
    const aspect = Math.random() > 0.5 ? "16:9" : "4:3";
    const width = aspect === "16:9" ? 1920 : 1600;
    const height = aspect === "16:9" ? 1080 : 1200;

    return {
        primaryImage: {
            url: `https://example.com/events/${category}/${Math.floor(Math.random() * 100)}.jpg`,
            alt: `${category} event in Kampala, Uganda`,
            width: width,
            height: height,
            aspectRatio: aspect
        },
        gallery: [
            {
                url: `https://example.com/events/${category}/gallery/${Math.floor(Math.random() * 50)}_1.jpg`,
                alt: `${category} event preview 1`,
                width: 800,
                height: 600
            },
            {
                url: `https://example.com/events/${category}/gallery/${Math.floor(Math.random() * 50)}_2.jpg`,
                alt: `${category} event preview 2`,
                width: 800,
                height: 600
            }
        ]
    };
}

// Function to generate embedding from title and description
async function generateEmbedding(title: string, description: string): Promise<number[]> {
    try {
        // Combine title and description for embedding generation
        const textToEmbed = `${title}. ${description}`;

        // In a real implementation, you would call an embedding API here:
        // Example with OpenAI (commented out as it would require API key):
        /*
        const { Configuration, OpenAIApi } = require("openai");
        const configuration = new Configuration({
          apiKey: process.env.OPENAI_API_KEY,
        });
        const openai = new OpenAIApi(configuration);
        const response = await openai.createEmbedding({
          model: "text-embedding-ada-002",
          input: textToEmbed,
        });
        return response.data.data[0].embedding;
        */

        // For this example, we'll generate a mock embedding
        // Real embeddings would typically be 1536 dimensions for OpenAI or
        // similar dimension for other services
        const EMBEDDING_DIMENSIONS = 1536; // Standard for many embedding services

        // Generate a deterministic "embedding" based on the content
        // This ensures similar content gets similar embeddings
        // Note: This is NOT a real embedding and won't have semantic properties
        // but helps demonstrate the database structure
        const mockEmbedding: number[] = [];
        let seed = 0;
        for (let i = 0; i < textToEmbed.length; i++) {
            seed += textToEmbed.charCodeAt(i);
        }

        // Generate a pseudo-random but deterministic vector
        for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
            // Simple deterministic function that generates a value between -1 and 1
            mockEmbedding.push(Math.sin(seed * (i + 1) % 997) / 2 + 0.5);
        }

        // Normalize the embedding to unit length
        const magnitude = Math.sqrt(mockEmbedding.reduce((sum, val) => sum + val * val, 0));
        const normalizedEmbedding = mockEmbedding.map(val => val / magnitude);

        return normalizedEmbedding;
    } catch (error) {
        console.error("Error generating embedding:", error);
        // Return a random embedding vector if generation fails
        const EMBEDDING_DIMENSIONS = 1536;
        return Array(EMBEDDING_DIMENSIONS).fill(0).map(() => Math.random() * 2 - 1);
    }
}

// Main function to create all events
async function generateAllEvents() {
    try {
        console.log("Starting event generation...");

        // Generate event data for each category
        const categories = [
            { name: 'music', count: 100, venues: musicVenues, baseNames: musicEvents },
            { name: 'sports', count: 100, venues: sportsVenues, baseNames: sportsEvents },
            { name: 'corporate', count: 100, venues: corporateVenues, baseNames: corporateEvents },
            { name: 'festivals', count: 100, venues: festivalVenues, baseNames: festivalEvents }
        ];

        for (const category of categories) {
            console.log(`Generating ${category.count} ${category.name} events...`);

            // Get all eventNames for this category
            const eventNames = generateEventNames(category.baseNames, category.count);

            // Create canonical events and then the actual events
            for (let i = 0; i < category.count; i++) {
                const eventName = eventNames[i];
                const venue = category.venues[i % category.venues.length];
                const eventDate = randomAugust2025Date();
                const description = generateDescription(eventName, category.name);

                // Generate embedding for canonical event
                const canonicalEmbedding = await generateEmbedding(eventName, description);

                // First create the canonical event
                const canonicalEvent = await prisma.canonical_events.create({
                    data: {
                        eventname: eventName,
                        eventvenue: venue,
                        eventdescription: description,
                        eventstartdatetime: eventDate,
                        city: "Kampala",
                        state: "Central Region",
                        country: "Uganda",
                        rawdata: {
                            category: category.name,
                            createdBy: "generator-script",
                            additionalInfo: `${category.name} event #${i + 1}`,
                            // Store embedding in rawdata instead since it's not in the schema
                            embedding: canonicalEmbedding
                        },
                        processedat: new Date(),

                    }
                });

                // Generate embedding for event (might be slightly different due to venue name)
                const eventEmbedding = await generateEmbedding(eventName, description);

                // Then create the event with the canonical event reference using raw SQL
                // This allows us to directly set the embedding field
                const [lat, long] = randomKampalaLocation();
                const geoLocation = JSON.stringify([lat, long]);
                const metadata = JSON.stringify({
                    ...generateMetadata(category.name),
                    embedding: eventEmbedding
                });
                const imageData = JSON.stringify(generateImageData(category.name));

                // Use SQL query to insert the event with the embedding field
                await prisma.$executeRaw`
                    INSERT INTO events (
                        canonical_event_id,
                        eventname,
                        eventvenuename,
                        eventdescription,
                        eventstartdatetime,
                        city,
                        state,
                        country,
                        geolocation,
                        metadata,
                        imagedata,
                        embedding
                    ) VALUES (
                        ${canonicalEvent.id},
                        ${eventName},
                        ${venue},
                        ${description},
                        ${eventDate},
                        ${'Kampala'},
                        ${'Central Region'},
                        ${'Uganda'},
                        ${geoLocation}::json,
                        ${metadata}::json,
                        ${imageData}::json,
                        ${eventEmbedding}::vector
                    )
                `;

                // Log progress for every 20 events
                if ((i + 1) % 20 === 0) {
                    console.log(`...Created ${i + 1} ${category.name} events`);
                }
            }

            console.log(`Completed generating ${category.name} events.`);
        }

        console.log("All events generated successfully!");
    } catch (error) {
        console.error("Error generating events:", error);
    } finally {
        await prisma.$disconnect();
    }
}

// Execute the function
generateAllEvents()
    .then(() => console.log("Script completed."))
    .catch(e => console.error("Script failed:", e));
