'use client';

import * as React from 'react';
// The external dependency '@tanstack/react-table' has been removed to fix the compilation error.
// The table logic now uses standard React state and native HTML elements styled with Tailwind CSS.

// Assuming Lucide-react is available for the icon (Settings2 icon removed as it's not used in the simplified table)
// No internal Shadcn imports ('@/components/ui/...') are used to ensure maximum compatibility.

// ────────────────────────────────────────────────────────────────
// UTILITY: Status Badge Component (Visualizes the new Quarantined status)
// ────────────────────────────────────────────────────────────────

// The 'Quarantined' status is included here.
type Status = 'Active' | 'Sold' | 'Deceased' | 'Culled' | 'Quarantined';

interface StatusBadgeProps {
    status: Status;
}

/**
 * Renders a visually distinct badge for the rabbit's status.
 * Highlights 'Quarantined' with red and a pulsing animation.
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    let colorClass = '';

    switch (status) {
        case 'Active':
            colorClass = 'bg-green-100 text-green-800 border-green-300';
            break;
        case 'Quarantined':
            // Highlighted color for the new Quarantined status
            colorClass = 'bg-red-100 text-red-800 border-red-300 ring-4 ring-red-200 ring-opacity-50 animate-pulse';
            break;
        case 'Sold':
            colorClass = 'bg-gray-100 text-gray-800 border-gray-300';
            break;
        case 'Deceased':
        case 'Culled':
            colorClass = 'bg-slate-100 text-slate-800 border-slate-300';
            break;
        default:
            colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-300';
            break;
    }

    return (
        <span
            className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${colorClass}`}
        >
            {status}
        </span>
    );
};

// ────────────────────────────────────────────────────────────────
// MAIN COMPONENT: Simplified Rabbit Data Table
// ────────────────────────────────────────────────────────────────

// Define the required shape of the data item
interface RabbitTableDataItem {
    _id: string;
    tag_id: string;
    full_name: string;
    gender: 'Male' | 'Female';
    age_in_days: number;
    maturity_status: string;
    status: Status;
    is_pregnant: boolean;
    breed_name: string;
    cage_id: string;
}

interface RabbitDataTableProps {
    data: RabbitTableDataItem[];
}

export const RabbitDataTable: React.FC<RabbitDataTableProps> = ({ data }) => {
    // State for search and pagination
    const [searchTerm, setSearchTerm] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(1);
    const pageSize = 10;

    // ✅ FIX: Reset to page 1 when data changes externally (e.g., after filter/fetch)
    React.useEffect(() => {
        setCurrentPage(1);
    }, [data.length]);
    
    // Filter data based on search term (Tag ID or Name)
    const filteredData = React.useMemo(() => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return data.filter(rabbit => 
            rabbit.tag_id.toLowerCase().includes(lowerSearchTerm) ||
            rabbit.full_name.toLowerCase().includes(lowerSearchTerm)
        );
    }, [data, searchTerm]);

    // Calculate pagination details
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    // Slice data for the current page
    const currentData = filteredData.slice(startIndex, endIndex);

    return (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            {/* Search Input */}
            <div className="p-4 border-b border-gray-200">
                <input
                    type="text"
                    placeholder="Search by Tag ID or Name..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        // Reset to page 1 on search
                        setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tag ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age (Days)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Breed</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cage</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pregnant?</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentData.length > 0 ? (
                            currentData.map((rabbit) => (
                                <tr key={rabbit._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rabbit.tag_id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rabbit.full_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <StatusBadge status={rabbit.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rabbit.gender}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {rabbit.age_in_days} 
                                        <span className="ml-1 text-xs text-indigo-500">({rabbit.maturity_status})</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rabbit.breed_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rabbit.cage_id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {rabbit.is_pregnant ? 'Yes' : 'No'}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} className="px-6 py-10 text-center text-gray-500 text-lg">
                                    {searchTerm ? 'No rabbits match your search.' : 'No rabbit records found.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                    Showing {Math.min(totalItems, startIndex + 1)} to {Math.min(totalItems, endIndex)} of {totalItems} entries
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        className="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-indigo-500 bg-indigo-500 text-white hover:bg-indigo-700 h-10 px-4 py-2 disabled:opacity-30 disabled:cursor-not-allowed shadow-md transition-colors duration-200"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <span className="text-sm font-semibold text-gray-800">
                        Page {totalPages === 0 ? 0 : currentPage} of {totalPages}
                    </span>
                    <button
                        className="inline-flex items-center justify-center rounded-lg text-sm font-medium border border-indigo-500 bg-indigo-500 text-white hover:bg-indigo-700 h-10 px-4 py-2 disabled:opacity-30 disabled:cursor-not-allowed shadow-md transition-colors duration-200"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}

// ────────────────────────────────────────────────────────────────
// NOTE: This structure is no longer needed by DataTable but documents the data fields.
// ────────────────────────────────────────────────────────────────
export const rabbitColumns = [
    { header: 'Tag ID', accessor: 'tag_id' },
    { header: 'Name', accessor: 'name' },
    { header: 'Status', accessor: 'status' },
    // Removed 'is_quarantined' as it is a status now
    { header: 'Age (Days)', accessor: 'age_in_days', subAccessor: 'maturity_status' }
];