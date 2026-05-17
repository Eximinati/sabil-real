import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    collections: [
      { id: 'bukhari', name: 'Sahih al-Bukhari', arabic: 'صحيح البخاري' },
      { id: 'muslim', name: 'Sahih Muslim', arabic: 'صحيح مسلم' },
      { id: 'abudawud', name: 'Sunan Abu Dawud', arabic: 'سنن أبي داود' },
      { id: 'tirmidhi', name: "Jami' at-Tirmidhi", arabic: 'جامع الترمذي' },
      { id: 'nasai', name: "Sunan an-Nasa'i", arabic: 'سنن النسائي' },
      { id: 'ibnmajah', name: 'Sunan Ibn Majah', arabic: 'سنن ابن ماجه' },
      { id: 'malik', name: 'Muwatta Malik', arabic: 'موطأ مالك' },
    ]
  });
}