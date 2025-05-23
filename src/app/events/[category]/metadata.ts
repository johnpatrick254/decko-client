import { Metadata } from "next";

export async function generateMetadata({ searchParams }: {
    searchParams: Promise<{ id?: string; title?: string }>
},): Promise<Metadata> {
    const baseMetadata: Metadata = {
        title: "Decko",
        description: "Your daily dose of breaking news",
        openGraph: {
            title: "Decko",
            description: "Your daily dose of breaking news",
            images: ['/favicon.ico'],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: "Decko",
            description: "Your daily dose of breaking news",
            images: ['/favicon.ico'],
        }
    };

    const id = (await searchParams).id;

    try {
        if (!id || isNaN(parseInt(id, 10))) {
            return baseMetadata;
        }
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/metadata/event/${id}`);
        if (!response.ok) {
            return baseMetadata;
        }

        const metadata = await response.json();
        return {
            title: metadata.title || "Decko",
            description: metadata.description || "Your daily dose of breaking news",
            openGraph: {
                title: metadata.title || "Decko",
                description: metadata.description || "Your daily dose of breaking news",
                images: [{
                    url: metadata.image || '/favicon.ico',
                    width: 1200,
                    height: 630,
                    alt: metadata.title || "Decko Event"
                }],
                type: 'article',
            },
            twitter: {
                card: 'summary_large_image',
                title: metadata.title || "Decko",
                description: metadata.description || "Your daily dose of breaking news",
                images: [{
                    url: metadata.image || '/favicon.ico',
                    width: 1200,
                    height: 630,
                    alt: metadata.title || "Decko Event"
                }],
            }
        };
    } catch (error) {
        console.error('Error fetching event metadata:', error);
        return baseMetadata;
    }
}
