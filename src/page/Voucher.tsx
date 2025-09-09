import React, { useState, useEffect } from "react";
import { asyncGet } from "../utils/fetch";
import { voucher_api } from "../api/api";
import { type Voucher } from "../interfaces/vocher";
import { Header } from "../components/Header";
import '../styles/Voucher.css';
import { AddVoucherModal } from "../components/voucher/AddVoucherModal";
import { EditVoucherModal } from "../components/voucher/EditVoucherModal";
import { VoucherCard } from "../components/voucher/VoucherCard";
import { useNotification } from "../context/NotificationContext";
import { IoTicket } from "react-icons/io5"; 

export const VoucherPage: React.FC = () => {
    const [search, setSearch] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
    const [loading, setLoading] = useState(true);
    const { showError } = useNotification();

    const filteredVouchers = vouchers.filter(voucher =>
        voucher.name.includes(search) || voucher.description.includes(search)
    );
    
    useEffect(() => {
        const fetchVouchers = async () => {
            try {
                setLoading(true);
                const response = await asyncGet(voucher_api.all, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.body) {
                    setVouchers(response.body);
                }
            } catch (e) {
                console.log(e);
                showError("獲取電子票券失敗");
            } finally {
                setLoading(false);
            }
        }
        fetchVouchers();
    }, []);

    const handleOpenAddModal = () => {
        setShowAddModal(true);
    };

    const handleVoucherSave = (newVoucher: Voucher) => {
        setVouchers(prev => [...prev, newVoucher]);
    };

    const handleVoucherEdit = (voucher: Voucher) => {
        setSelectedVoucher(voucher);
        setShowEditModal(true);
    };

    const handleVoucherUpdate = (updatedVoucher: Voucher) => {
        setVouchers(prev => prev.map(v => v._id === updatedVoucher._id ? updatedVoucher : v));
    };

    const handleVoucherDelete = (voucherId: string) => {
        setVouchers(prev => prev.filter(v => v._id !== voucherId));
    };

    if (loading) {
        return (
            <>
                <Header />
                <div className="voucher-container">
                    <div className="voucher-loading">載入中...</div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="voucher-container">
                <div className="voucher-header">
                    <div className="voucher-search-group">
                        <span role="img" aria-label="search" style={{ fontSize: 20 }}>🔍</span>
                        <input
                            type="text"
                            placeholder="搜尋電子票券"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="voucher-search-input"
                        />
                    </div>
                    <div>
                        <button className="voucher-add-btn" onClick={handleOpenAddModal}>
                            <IoTicket size={20}/>
                            <p>新增電子票券</p>
                        </button>
                    </div>
                </div>

                <div className="voucher-grid">
                    {filteredVouchers.length === 0 ? (
                        <div className="voucher-empty">
                            <p>尚未有電子票券</p>
                            <button className="voucher-add-btn" onClick={handleOpenAddModal}>
                                新增第一個電子票券
                            </button>
                        </div>
                    ) : (
                        filteredVouchers.map((voucher) => (
                            <VoucherCard
                                key={voucher._id}
                                voucher={voucher}
                                onEdit={() => handleVoucherEdit(voucher)}
                            />
                        ))
                    )}
                </div>

                <AddVoucherModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onSave={handleVoucherSave}
                />

                <EditVoucherModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    onSave={handleVoucherUpdate}
                    onDelete={handleVoucherDelete}
                    voucher={selectedVoucher}
                />
            </div>
        </>
    );
};