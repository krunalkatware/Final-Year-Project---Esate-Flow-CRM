import React from 'react';
import { 
  FileText, 
  Download, 
  Layers, 
  Map, 
  Calculator, 
  CheckCircle 
} from 'lucide-react';
import { toast } from '../../contexts/ToastContext';

interface DocumentItem {
  title: string;
  type: string;
  size: string;
  category: string;
  download_url?: string;
}

interface PropertyDocumentsProps {
  propertyName?: string;
  documents?: DocumentItem[];
}

export const PropertyDocuments: React.FC<PropertyDocumentsProps> = ({
  propertyName = 'Property',
  documents,
}) => {
  const defaultDocs: DocumentItem[] = [
    { title: 'Project E-Brochure', type: 'PDF Document', size: '4.2 MB', category: 'brochure' },
    { title: 'Architectural Floor Plan', type: 'PDF Blueprint', size: '2.8 MB', category: 'floorplan' },
    { title: 'Master Development Layout', type: 'PDF Blueprint', size: '5.1 MB', category: 'masterplan' },
    { title: 'Official Price Sheet & Taxes', type: 'PDF Document', size: '1.5 MB', category: 'pricesheet' },
  ];

  const docList = documents && documents.length > 0 ? documents : defaultDocs;

  const handleDownload = (doc: DocumentItem) => {
    toast.success(`Downloading ${doc.title} (${doc.size})...`);

    // Generate dynamic sample downloadable text file formatted as PDF payload
    const content = `ESTATEFLOW OFFICIAL PROPERTY DOCUMENT\n\nTitle: ${doc.title}\nProperty: ${propertyName}\nType: ${doc.type}\nFile Size: ${doc.size}\nDate Generated: ${new Date().toLocaleDateString()}\n\nThis is a verified official brochure and plan document issued by EstateFlow.`;
    const blob = new Blob([content], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${propertyName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${doc.category}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getDocIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'brochure':
        return <FileText className="w-6 h-6 text-primary" />;
      case 'floorplan':
        return <Layers className="w-6 h-6 text-indigo-600" />;
      case 'masterplan':
        return <Map className="w-6 h-6 text-emerald-600" />;
      case 'pricesheet':
        return <Calculator className="w-6 h-6 text-amber-600" />;
      default:
        return <FileText className="w-6 h-6 text-slate-600" />;
    }
  };

  return (
    <div className="bg-card text-text-primary rounded-3xl p-6 sm:p-8 border border-border shadow-card space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-xl text-text-primary flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Property Verification Documents
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Download certified brochures, layout blueprints, and price breakdowns
          </p>
        </div>
        <span className="badge badge-success text-[10px] uppercase font-semibold flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> RERA Approved
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {docList.map((doc, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-surface border border-border hover:border-primary/40 hover:bg-surface-secondary transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-surface-secondary rounded-xl border border-border shadow-xs group-hover:scale-105 transition-transform">
                {getDocIcon(doc.category)}
              </div>
              <div>
                <h4 className="font-heading font-bold text-sm text-text-primary group-hover:text-primary transition-colors">
                  {doc.title}
                </h4>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  {doc.type} • {doc.size}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleDownload(doc)}
              className="btn btn-outline btn-xs gap-1.5 shrink-0 hover:btn-primary"
              title="Download File"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Download</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
