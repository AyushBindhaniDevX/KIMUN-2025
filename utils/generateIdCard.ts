import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export const generateIdCard = async (delegateName: string, committee: string) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([400, 250]);

  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Add content
  page.drawText('MUN 2024 ID CARD', {
    x: 50,
    y: height - 50,
    size: 20,
    font,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Name: ${delegateName}`, {
    x: 50,
    y: height - 100,
    size: 16,
    font,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Committee: ${committee}`, {
    x: 50,
    y: height - 140,
    size: 16,
    font,
    color: rgb(0, 0, 0),
  });

  return await pdfDoc.save();
};