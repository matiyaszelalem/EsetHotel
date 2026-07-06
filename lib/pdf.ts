import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const generateInvoice = (booking: any, hotelSettings: any = null) => {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(22)
  doc.text(hotelSettings?.hotelName || 'Eset Hotel', 14, 20)
  
  doc.setFontSize(10)
  doc.text(hotelSettings?.address || 'Addis Ababa, Ethiopia', 14, 28)
  doc.text(hotelSettings?.contactEmail || 'info@esethotel.com', 14, 34)
  
  // Invoice Details
  doc.setFontSize(16)
  doc.text('INVOICE', 140, 20)
  
  doc.setFontSize(10)
  doc.text(`Invoice No: ${booking.referenceId}`, 140, 28)
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 140, 34)
  
  // Guest Details
  doc.setFontSize(12)
  doc.text('Bill To:', 14, 48)
  doc.setFontSize(10)
  doc.text(booking.guestName || '', 14, 54)
  doc.text(booking.guestEmail || '', 14, 60)
  if (booking.guestPhone) doc.text(booking.guestPhone, 14, 66)
  
  // Booking Summary
  doc.setFontSize(12)
  doc.text('Booking Details:', 140, 48)
  doc.setFontSize(10)
  doc.text(`Check-in: ${new Date(booking.checkIn).toLocaleDateString()}`, 140, 54)
  doc.text(`Check-out: ${new Date(booking.checkOut).toLocaleDateString()}`, 140, 60)
  doc.text(`Guests: ${booking.guests}`, 140, 66)
  
  // Room Table
  const room = booking.rooms?.[0]
  const roomName = room?.room?.roomType?.name || 'Hotel Room'
  const nights = Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24))
  const pricePerNight = room?.pricePerNight || (booking.totalPrice / Math.max(1, nights))
  
  autoTable(doc, {
    startY: 80,
    head: [['Description', 'Nights', 'Price/Night', 'Total']],
    body: [
      [roomName, nights, `$${pricePerNight.toFixed(2)}`, `$${(nights * pricePerNight).toFixed(2)}`],
    ],
  })
  
  const finalY = (doc as any).lastAutoTable.finalY || 100
  
  // Totals
  const subTotal = booking.totalPrice / 1.15
  const tax = booking.totalPrice - subTotal
  
  doc.text(`Subtotal: $${subTotal.toFixed(2)}`, 140, finalY + 10)
  doc.text(`Tax (15%): $${tax.toFixed(2)}`, 140, finalY + 16)
  doc.setFontSize(12)
  doc.text(`Total: $${booking.totalPrice.toFixed(2)}`, 140, finalY + 24)
  
  doc.setFontSize(10)
  doc.text(`Payment Status: ${booking.payment?.status || 'PENDING'}`, 14, finalY + 24)
  
  // Footer
  doc.setFontSize(8)
  doc.text('Thank you for choosing Eset Hotel!', 105, 280, { align: 'center' })
  
  // Save PDF
  doc.save(`Invoice_${booking.referenceId}.pdf`)
}
