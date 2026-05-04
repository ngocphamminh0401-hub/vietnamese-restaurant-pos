import React, { useState } from 'react';
import { usePOS } from '../../../context/POSContext';
import { ChevronLeft, ChevronRight, Calendar, Plus } from 'lucide-react';

export const WorkScheduleManager: React.FC = () => {
    const { staff, shifts } = usePOS();
    const [currentDate, setCurrentDate] = useState(new Date());

    // Helper to get start of week (Monday)
    const getStartOfWeek = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    };

    const startOfWeek = getStartOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        return d;
    });

    const changeWeek = (offset: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + offset * 7);
        setCurrentDate(newDate);
    };

    const getShiftForStaff = (staffId: string, date: Date) => {
        const dateStr = date.toISOString().slice(0, 10);
        return shifts.find(s => s.staffId === staffId && s.date === dateStr);
    };

    const getShiftColor = (shiftName: string) => {
        switch(shiftName) {
            case 'SÁNG': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'CHIỀU': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'TỐI': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            default: return 'bg-gray-100';
        }
    };

    return (
        <div className="flex h-full bg-white flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shrink-0">
                <h3 className="font-bold text-xl text-gray-800">Lịch làm việc</h3>
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                        <button onClick={() => changeWeek(-1)} className="p-1 hover:bg-white rounded shadow-sm transition"><ChevronLeft size={16}/></button>
                        <div className="px-4 font-bold text-sm text-gray-700 flex items-center">
                            <Calendar size={14} className="mr-2"/> 
                            Tuần {weekDays[0].toLocaleDateString('vi-VN', {day:'2-digit', month:'2-digit'})} - {weekDays[6].toLocaleDateString('vi-VN', {day:'2-digit', month:'2-digit'})}
                        </div>
                        <button onClick={() => changeWeek(1)} className="p-1 hover:bg-white rounded shadow-sm transition"><ChevronRight size={16}/></button>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-bold flex items-center shadow-sm transition">
                        <Plus size={16} className="mr-1"/> Xếp lịch tự động
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-gray-50">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="grid grid-cols-[200px_repeat(7,1fr)] divide-x divide-gray-200 border-b border-gray-200">
                        <div className="p-4 bg-gray-50 font-bold text-gray-700 flex items-center justify-center">Nhân viên</div>
                        {weekDays.map((day, idx) => (
                            <div key={idx} className={`p-3 text-center ${day.toDateString() === new Date().toDateString() ? 'bg-blue-50' : 'bg-gray-50'}`}>
                                <div className="text-xs font-bold text-gray-500 uppercase">{day.toLocaleDateString('vi-VN', {weekday: 'short'})}</div>
                                <div className={`text-sm font-bold ${day.toDateString() === new Date().toDateString() ? 'text-blue-600' : 'text-gray-800'}`}>
                                    {day.getDate()}/{day.getMonth() + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="divide-y divide-gray-200">
                        {staff.map(s => (
                            <div key={s.id} className="grid grid-cols-[200px_repeat(7,1fr)] divide-x divide-gray-200 hover:bg-gray-50 transition">
                                <div className="p-4 flex flex-col justify-center">
                                    <div className="font-bold text-sm text-gray-900">{s.name}</div>
                                    <div className="text-xs text-gray-500">{s.role}</div>
                                </div>
                                {weekDays.map((day, idx) => {
                                    const shift = getShiftForStaff(s.id, day);
                                    return (
                                        <div key={idx} className="p-2 min-h-[80px] relative group cursor-pointer hover:bg-gray-100">
                                            {shift ? (
                                                <div className={`h-full w-full rounded p-2 border text-xs flex flex-col justify-center items-center ${getShiftColor(shift.shiftName)}`}>
                                                    <span className="font-bold">{shift.shiftName}</span>
                                                    <span className="opacity-80 mt-1">{shift.startTime} - {shift.endTime}</span>
                                                </div>
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                    <Plus size={20} className="text-gray-300"/>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};