import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Itinerary, PlannerInput } from '../types';

export const generatePDF = (itinerary: Itinerary, input: PlannerInput) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 14;
  let yPos = 20;

  // --- HELPER: ADD SECTION TITLE ---
  const addSectionTitle = (title: string) => {
    if (yPos > 270) {
        doc.addPage();
        yPos = 20;
    }
    doc.setFontSize(14);
    doc.setTextColor(0, 102, 102); // Emerald Color
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, yPos);
    yPos += 8;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
    yPos += 5;
    doc.setTextColor(0, 0, 0); // Reset color
    doc.setFont('helvetica', 'normal');
  };

  // --- HELPER: CHECK PAGE BREAK ---
  const checkPageBreak = (height: number) => {
    if (yPos + height > 280) {
      doc.addPage();
      yPos = 20;
      return true;
    }
    return false;
  };

  // ==========================================
  // 1. HEADER & TRIP SUMMARY
  // ==========================================
  doc.setFontSize(20); // Slightly smaller for safety
doc.setTextColor(0, 102, 102);
doc.setFont('helvetica', 'bold');

const titleText = itinerary.title || "Your Sri Lanka Journey";

// Wrap title within page width
const titleLines = doc.splitTextToSize(
  titleText,
  pageWidth - margin * 2
);

// Center each line
titleLines.forEach((line: string, index: number) => {
  doc.text(line, pageWidth / 2, yPos + index * 10, { align: 'center' });
});

// Move Y position correctly
yPos += titleLines.length * 10 + 5;
  
  yPos += 10;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'italic');
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 15;

  // Trip Summary Box
  doc.setFillColor(245, 250, 248); // Light Emerald bg
  doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 25, 3, 3, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'normal');
  const summaryLines = doc.splitTextToSize(itinerary.summary || "", pageWidth - (margin * 2) - 10);
  doc.text(summaryLines, margin + 5, yPos + 7);
  yPos += 35;

  // ==========================================
  // 2. LOGISTICS & PREFERENCES
  // ==========================================
  addSectionTitle("Trip Parameters");

  const logisticsData = [
    ['Arrival', `${input.arrivalDate} @ ${input.arrivalTime}`],
    ['Departure', `${input.departureDate} @ ${input.departureTime || 'TBD'}`],
    ['Start Point', input.startPoint.split(',')[0]],
    ['Travelers', `${input.adults} Adults${input.children > 0 ? `, ${input.children} Children` : ''}`],
    ['Vehicle', input.vehicleType],
    ['Trip Pace', input.pace || 'Moderate'],
    ['Hotel Tier', `${input.hotelRating} Star`],
    ['Guide', input.includeGuide ? "Included" : "Self-Guided"],
    ['Interests', input.interests.length > 0 ? input.interests.join(', ') : 'General'],
    ['Budget Limit', `$${input.budget} USD`]
  ];

  // Add User Notes if they exist
  if (input.userNotes) {
    logisticsData.push(['Special Requests', input.userNotes]);
  }
  // Add Mandatory Stop if exists
  if (input.nextDestination) {
    logisticsData.push(['Must Visit', input.nextDestination]);
  }

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: logisticsData,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3, overflow: 'linebreak' },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [240, 240, 240], cellWidth: 40 },
      1: { cellWidth: 'auto' }
    },
    margin: { left: margin, right: margin }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // ==========================================
  // 3. DAILY ITINERARY
  // ==========================================
  addSectionTitle("Daily Itinerary Details");

  itinerary.days.forEach((day, index) => {
    checkPageBreak(65); // Check for enough space for a day block

    // Day Header
    doc.setFillColor(0, 102, 102); // Dark Emerald
    doc.rect(margin, yPos, pageWidth - (margin * 2), 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Day ${day.day}: ${day.location} (${day.date})`, margin + 3, yPos + 5.5);
    
    yPos += 14;
    doc.setTextColor(0, 0, 0);

    const dayDescription = (day as any).description || (day as any).summary; 
    
    if (dayDescription) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(60, 60, 60); // Dark Gray

        const descLines = doc.splitTextToSize(dayDescription, pageWidth - (margin * 2));
        
        // Check if description fits, otherwise page break
        if (checkPageBreak(descLines.length * 5)) {
             yPos += 5; // Add top padding if new page
        }

        doc.text(descLines, margin, yPos);
        yPos += (descLines.length * 5) + 8; // Add space after description

        // Reset Styles
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0); 
    }

    // Accommodation & Travel Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Accommodation:`, margin, yPos);
    doc.setFont('helvetica', 'normal');
    // Handle accommodation object or string
    const accomName = typeof day.accommodation === 'string' 
        ? day.accommodation 
        : (day.accommodation?.name || 'Standard Hotel');
    doc.text(accomName, margin + 35, yPos);
    
    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text(`Travel Time:`, margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(day.travelTime || 'N/A', margin + 35, yPos);
    
    yPos += 10;

    // Activities List
    doc.setFont('helvetica', 'bold');
    doc.text("Highlights & Schedule:", margin, yPos);
    yPos += 6;
    
    doc.setFont('helvetica', 'normal');
    const activityLines: string[] = [];

    // Prioritize detailed timeline if available
    if (day.detailedActivities) {
        if (day.detailedActivities.morning) activityLines.push(`[Morning] ${day.detailedActivities.morning}`);
        if (day.detailedActivities.afternoon) activityLines.push(`[Afternoon] ${day.detailedActivities.afternoon}`);
        if (day.detailedActivities.evening) activityLines.push(`[Evening] ${day.detailedActivities.evening}`);
    } else {
        // Fallback to simple list
        day.activities.forEach(act => activityLines.push(`• ${act}`));
    }

    activityLines.forEach(line => {
        const splitLine = doc.splitTextToSize(line, pageWidth - (margin * 2));
        if (checkPageBreak(splitLine.length * 5)) {
             yPos += 5; 
        }
        doc.text(splitLine, margin + 5, yPos);
        yPos += (splitLine.length * 5) + 1; // Slight padding between items
    });

    yPos += 5;

    // Daily Cost Table
    const dailyCostData = [
        ['Accommodation', `$${day.estimatedCost?.accommodation || 0}`],
        ['Transport/Fuel', `$${day.estimatedCost?.transportFuel || 0}`],
        ['Tickets/Entry', `$${day.estimatedCost?.tickets || 0}`],
        ['Food/Meals', `$${day.estimatedCost?.food || 0}`],
        ['Guide/Misc', `$${(day.estimatedCost?.guide || 0) + (day.estimatedCost?.miscellaneous || 0)}`],
        ['Total Day Cost', `$${Object.values(day.estimatedCost || {}).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0)}`]
    ];

    autoTable(doc, {
        startY: yPos,
        head: [['Item', 'Est. Cost (USD)']],
        body: dailyCostData,
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 1.5 },
        headStyles: { fillColor: [220, 220, 220], textColor: 50, fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 30, halign: 'right' } },
        margin: { left: margin + 5 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  });

  // ==========================================
  // 4. FINANCIAL SUMMARY
  // ==========================================
  addSectionTitle("Financial Breakdown");

  const totals = {
    accommodation: 0,
    transport: 0,
    tickets: 0,
    food: 0,
    misc: 0,
    guide: 0
  };

  itinerary.days.forEach(d => {
    totals.accommodation += d.estimatedCost?.accommodation || 0;
    totals.transport += (d.estimatedCost?.transportFuel || 0) + (d.estimatedCost?.vehicleRental || 0);
    totals.tickets += d.estimatedCost?.tickets || 0;
    totals.food += d.estimatedCost?.food || 0;
    totals.misc += d.estimatedCost?.miscellaneous || 0;
    totals.guide += d.estimatedCost?.guide || 0;
  });

  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

  const summaryData = [
    ['Hotels & Accommodation', `$${totals.accommodation}`],
    ['Transport (Vehicle + Fuel)', `$${totals.transport}`],
    ['Entry Tickets & Activities', `$${totals.tickets}`],
    ['Food & Dining', `$${totals.food}`],
    ['Guide Fees', `$${totals.guide}`],
    ['Miscellaneous', `$${totals.misc}`],
    ['ESTIMATED GRAND TOTAL', `$${grandTotal} USD`]
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Category', 'Amount (USD)']],
    body: summaryData,
    theme: 'striped',
    styles: { fontSize: 11, cellPadding: 4 },
    headStyles: { fillColor: [0, 102, 102], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 
        0: { cellWidth: 130 }, 
        1: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold' } 
    },
    didParseCell: function(data) {
        if (data.row.index === summaryData.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [220, 255, 240];
        }
    },
    margin: { left: margin, right: margin }
  });

  // Footer
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Disclaimer: Prices are estimates based on standard rates. Actual costs may vary.", margin, finalY);

  // Save
  doc.save(`SriLanka_Trip_${input.adults}Adults${input.children > 0 ? `,${input.children}Children` : ''}_${new Date().toISOString().split('T')[0]}.pdf`);
};