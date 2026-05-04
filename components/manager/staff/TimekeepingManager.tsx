import React, { useState } from 'react';
import { usePOS } from '../../../context/POSContext';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export const TimekeepingManager: React.FC = () => {
    const { staff, timeRecords, shifts } = usePOS();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

    const getShiftForStaff = (staffId: string) => {
        return shifts.find(s => s.staffId === staffId && s.date === selectedDate);
    };

    const getTimeRecord = (staffId: string) => {
        return timeRecords.find(t => t.staffId === staffId && t.date === selectedDate);
    };

    const getStatusBadge = (status?: string) => {
        switch(status) {
            case 'ON_TIME': return <span className="flex items-center text-green-600 text-xs font-bold bg-green-100 px-2 py-1 rounded"><CheckCircle size={12} className="mr-1"/> Đúng giờ</span>;
            case 'LATE': return <span className="flex items-center text-orange-600 text-xs font-bold bg-orange-100 px-2 py-1 rounded"><AlertTriangle size={12} className="mr-1"/> Đi muộn</span>;
            case 'ABSENT': return <span className="flex items-center text-red-600 text-xs font-bold bg-red-100 px-2 py-1 rounded"><XCircle size={12} className="mr-1"/> Vắng mặt</span>;
            case 'LEAVE': return <span className="flex items-center text-blue-600 text-xs font-bold bg-blue-100 px-2 py-1 rounded">Xin nghỉ</span>;
            default: return <span className="text-gray-400 text-xs font-medium">-</span>;
        }
    };

    // Only show staff who have shift today or have a record
    const staffWithActivity = staff.filter(s => getShiftForStaff(s.id) || getTimeRecord(s.id));
    const activeStaffIds = staffWithActivity.map(s => s.id);
    const otherStaff = staff.filter(s => !activeStaffIds.includes(s.id));

    const renderRow = (s: any) => {
        const shift = getShiftForStaff(s.id);
        const record = getTimeRecord(s.id);
        
        return (
             <tr key={s.id} className="hover:bg-gray-50 transition">
                <td className="p-4">
                    <div className="font-bold text-gray-900 text-sm">{s.name}</div>
                    <div className="text-xs text-gray-500">{s.role}</div>
                </td>
                <td className="p-4 text-center">
                    {shift ? (
                        <div className="inline-block px-2 py-1 border border-gray-200 rounded bg-gray-50 text-xs font-medium">
                             {shift.shiftName} ({shift.startTime} - {shift.endTime})
                        </div>
                    ) : <span className="text-gray-400 text-xs">Không có lịch</span>}
                </td>
                <td className="p-4 text-center font-bold text-gray-800">{record?.checkIn || '--:--'}</td>
                <td className="p-4 text-center font-bold text-gray-800">{record?.checkOut || '--:--'}</td>
                <td className="p-4 text-center">{getStatusBadge(record?.status)}</td>
                <td className="p-4 text-center">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Cập nhật</button>
                </td>
            </tr>
        );
    }

    return (
        <div className="flex h-full bg-white flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shrink-0">
                <h3 className="font-bold text-xl text-gray-800">Bảng chấm công ngày</h3>
                <div className="flex items-center gap-4">
                     <div className="relative">
                        <input 
                            type="date" 
                            className="pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-700 font-medium"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-gray-50">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                     <table className="w-full text-left text-sm">
                        <thead className="bg-blue-50 text-gray-700 font-bold border-b border-blue-100">
                            <tr>
                                <th className="p-4 border-b">Nhân viên</th>
                                <th className="p-4 border-b text-center">Ca làm việc</th>
                                <th className="p-4 border-b text-center">Giờ vào</th>
                                <th className="p-4 border-b text-center">Giờ ra</th>
                                <th className="p-4 border-b text-center">Trạng thái</th>
                                <th className="p-4 border-b text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {staffWithActivity.length > 0 && (
                                <>
                                    <tr className="bg-gray-50"><td colSpan={6} className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Có lịch làm việc / Chấm công</td></tr>
                                    {staffWithActivity.map(renderRow)}
                                </>
                            )}
                            {otherStaff.length > 0 && (
                                <>
                                    <tr className="bg-gray-50"><td colSpan={6} className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Nhân viên khác</td></tr>
                                    {otherStaff.map(renderRow)}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};