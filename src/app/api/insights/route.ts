import { NextResponse } from "next/server";

const mockInsights = [
  {
    id: "1",
    category: "campaign",
    title: "Instagram campaign increased Spotify streams by 23% last week",
    body: "Your Summer Drop Instagram campaign correlated with a 23% spike in Spotify streams for Midnight Drive.",
    confidence: 0.91,
    actionable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    category: "revenue",
    title: "Apple Music listeners generate 2.1× higher revenue per stream than Spotify",
    body: "Apple Music pays $0.0084/stream vs Spotify's $0.0040/stream across your catalog.",
    confidence: 0.97,
    actionable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    category: "audience",
    title: "Texas has become your fastest growing audience state (+34% MoM)",
    body: "Texas listener growth outpaces national average by 2.8x. Houston and Austin are primary drivers.",
    confidence: 0.88,
    actionable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    category: "streaming",
    title: "Playlist 'Indie Vibes' is responsible for 18% of monthly revenue",
    body: "The editorial Spotify playlist generated an estimated $1,680 in streaming revenue last month.",
    confidence: 0.94,
    actionable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "5",
    category: "revenue",
    title: "Revenue per stream is declining — more plays from lower-paying territories",
    body: "India listener share grew +41% MoM. Indian streaming rates average $0.0012/stream.",
    confidence: 0.85,
    actionable: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "6",
    category: "audience",
    title: "Your best release time based on listener activity is Thursday 7–9 PM EST",
    body: "Posts and releases in this window see 34% higher engagement than your Monday morning average.",
    confidence: 0.82,
    actionable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "7",
    category: "campaign",
    title: "Ad campaign 'Summer Drop' achieved 3.2× ROAS — highest performing campaign this year",
    body: "$312 spend generated $997 in attributed revenue. Key creative: 15-second Reel with lyrics overlay.",
    confidence: 0.89,
    actionable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "8",
    category: "revenue",
    title: "3 songs have not been registered with MLC — estimated uncollected: $240",
    body: "Electric Soul, Sunrise Boulevard, and Neon Nights are missing MLC registration. Registration is free.",
    confidence: 0.99,
    actionable: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "9",
    category: "forecast",
    title: "Forecast: if current growth holds, you will cross 100K monthly listeners in 6 weeks",
    body: "At 12.3% MoM growth rate, 100K monthly Spotify listeners projected by August 3, 2024.",
    confidence: 0.78,
    actionable: false,
    createdAt: new Date().toISOString(),
  },
];

export async function GET() {
  return NextResponse.json({ insights: mockInsights }, { status: 200 });
}
