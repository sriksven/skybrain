import AirportBoardClient from './AirportBoardClient';

// Server Component
export default function AirportPage({ params }: { params: { icao: string } }) {
    return <AirportBoardClient icao={params.icao} />;
}

export async function generateStaticParams() {
    // Pre-render popular airports
    return [
        { icao: 'KBOS' },
        { icao: 'KJFK' },
        { icao: 'EGLL' },
        { icao: 'OMDB' },
        { icao: 'KSFO' },
        { icao: 'KLAX' },
    ];
}
