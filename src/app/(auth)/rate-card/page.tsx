
"use client";

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import ProtectedRoute from '@/components/auth/ProtectedRoute';


interface RateCardData {
  R1: string;
  bopp_tape_mtrs: string;
  R15: string;
  R16: string;
  R17: string;
  R18: string;
  R19: string; 
  R20: string; 
  R21: string;
}

const formatValue = (value: string | number | null | undefined, decimals: number = 2): string => {
  const strValue = String(value); 
  if (value === null || value === undefined || strValue.trim() === '-' || strValue.trim() === '') {
    return 'N/A';
  }
  const num = Number(strValue);
  if (isNaN(num)) {
    return 'N/A'; 
  }
  if (decimals === 0) {
    return num.toFixed(0);
  }
  return num.toFixed(decimals);
};

function RateCardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const data: RateCardData = {
    R1: searchParams.get('R1') ?? '-',
    bopp_tape_mtrs: searchParams.get('bopp_tape_mtrs') ?? '-',
    R15: searchParams.get('R15') ?? '-', // 12MM
    R16: searchParams.get('R16') ?? '-', // 24MM 
    R17: searchParams.get('R17') ?? '-', // 36MM 
    R18: searchParams.get('R18') ?? '-', // 48MM
    R19: searchParams.get('R19') ?? '-', // For 60MM in table as per updated logic
    R20: searchParams.get('R20') ?? '-', // For 72MM in table as per updated logic
    R21: searchParams.get('R21') ?? '-', // 96MM
  };
  
  const tableData = [
    { sr: 1, size: '12MM', rateKey: 'R15' },
    { sr: 2, size: '24MM', rateKey: 'R16' },
    { sr: 3, size: '36MM', rateKey: 'R17' },
    { sr: 4, size: '48MM', rateKey: 'R18' },
    { sr: 5, size: '60MM', rateKey: 'R19' }, 
    { sr: 6, size: '72MM', rateKey: 'R20' }, 
    { sr: 7, size: '96MM', rateKey: 'R21' },
  ];


  const handlePrint = () => {
    const buttons = document.getElementById('print-action-buttons');
    if (buttons) buttons.style.display = 'none';
    window.print();
    if (buttons) setTimeout(() => {
      buttons.style.display = 'flex';
    }, 100);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-white py-8 px-4 print:bg-white print:py-0 print:px-0">
      <Toaster />
      <div className="w-full max-w-4xl print:max-w-full">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 print:hidden" id="print-action-buttons">
          <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Calculator
          </Button>
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Print Rate Card
            </Button>
          </div>
        </div>

        <div id="rate-card-content" className="border border-gray-300 rounded-lg p-6 bg-white print:border-none print:p-4 print:shadow-none">
          <div className="w-fit mx-auto border-b border-gray-900 mb-1">
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 text-indigo-900">
              <div className="flex flex-col items-center">
                <Image
                  src="/assets/JM-logo.png"
                  alt="Company Logo"
                  className="w-[80px] h-[80px] sm:w-[120px] sm:h-[120px] object-contain"
                  width={120}
                  height={120}
                  priority
                />
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-lg font-bold">J M PLASTOPACK PVT. LTD.</h2>
                <p className="text-sm">📱 +91 91066 61479</p>
                <p className="text-sm">🌐 www.jmplastopack.com</p>
                <p className="text-sm">📧 info@jmplastopack.com</p>
              </div>
            </div>
          </div>

          <div className="text-indigo-900 text-center text-sm mb-1">
            <div className="inline-block border-b border-gray-900 pb-1">
              <p>Survey no.968-P, Near Chacharwadi Temple, Chacharwadi Vasna</p>
              <p>Sarkhej-Bavla Highway, Ta. Sanand, Dist. Ahmedabad-382213, GUJARAT. INDIA</p>
            </div>
          </div>
          <div className="text-indigo-900 text-center text-sm">
            <div className="mb-3 text-indigo-900 text-center text-sm border-b border-gray-900 pb-1">
              <p>● GST No.: 24AAFCJ8370A1ZT ● CIN No.: U25190GJ2022PTC137183 ● PAN No.: AAFCJ8370A</p>
            </div>
          </div>

          <div className="mb-6 text-left pl-4 sm:pl-6">
            <p className="text-lg font-medium">Dear Sir/Madam,</p>
            <p className="text-md mt-2">Please find below the calculated rates based on your inputs:</p>
            <p className="text-sm mt-1">(Microns: {formatValue(data.R1, 2)}, Tape Length: {formatValue(data.bopp_tape_mtrs, 0)} Mtrs)</p>
          </div>

          <div className="max-w-md mx-auto">
            <h1 className="text-xl font-medium mt-4 uppercase text-center">BOPP TAPE RATES</h1>
            <Table className="border-collapse">
              <TableHeader>
                <TableRow className="border-b-2 border-black">
                  <TableHead className="font-bold text-center py-2 w-16">Sr No.</TableHead>
                  <TableHead className="font-bold text-center py-2 w-32">SIZE</TableHead>
                  <TableHead className="font-bold text-center py-2">Meters Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map(item => (
                     <TableRow key={item.sr} className="border-b border-gray-300">
                        <TableCell className="text-center py-2">{item.sr}</TableCell>
                        <TableCell className="text-center py-2">{item.size}</TableCell>
                        <TableCell className="text-center py-2">{formatValue((data as any)[item.rateKey], 2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-12 ml-4 text-sm sm:text-base">
            <p className="font-bold uppercase mb-4 text-indigo-900">Terms & Conditions</p>
            <ol className="list-decimal list-inside pl-4 space-y-1 text-gray-700">
              <li>Taxes Applicable @ 18% GST Extra.</li>
              <li>Payment terms: 100% Advance with order.</li>
              <li>Delivery: Ex-factory.</li>
              <li>Rates are subject to change without prior notice. Please confirm before placing order.</li>
              <li>Brown Tape: Rs 2/- extra per kg (if applicable).</li>
            </ol>
          </div>

        </div>
      </div>

      <div className="mt-8 text-center text-slate-500 text-sm print:hidden">
        <p>© {new Date().getFullYear()} J M PlastoPack Pvt. Ltd. All rights reserved.</p>
      </div>
      <style jsx global>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:py-0 { padding-top: 0; padding-bottom: 0; }
          .print\\:px-0 { padding-left: 0; padding-right: 0; }
          .print\\:bg-white { background-color: white !important; }
          .print\\:border-none { border: none !important; }
          .print\\:p-4 { padding: 1rem !important; } 
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:max-w-full { max-width: 100% !important; }
          #rate-card-content {
             margin: 0 auto; 
          }
        }
      `}</style>
    </div>
  );
}

export default function RateCardPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'employee']}> 
        <Suspense fallback={<LoadingState />}>
        <RateCardContent />
        </Suspense>
    </ProtectedRoute>
  );
}

function LoadingState() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-white">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-lg text-slate-700">Loading Rate Card...</p>
      </div>
    </div>
  );
}

    