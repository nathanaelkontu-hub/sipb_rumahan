-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 25, 2026 at 08:51 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sipb_rumahan`
--

-- --------------------------------------------------------

--
-- Table structure for table `barang`
--

CREATE TABLE `barang` (
  `id_barang` int(11) NOT NULL,
  `nama_barang` varchar(100) NOT NULL,
  `kategori_barang` varchar(100) DEFAULT NULL,
  `sub_kategori_barang` varchar(100) DEFAULT NULL,
  `deskripsi` text DEFAULT NULL,
  `harga_dasar` decimal(10,2) NOT NULL,
  `satuan` varchar(20) DEFAULT 'pcs',
  `status` enum('tersedia','tidak_tersedia') DEFAULT 'tersedia',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `barang`
--

INSERT INTO `barang` (`id_barang`, `nama_barang`, `kategori_barang`, `sub_kategori_barang`, `deskripsi`, `harga_dasar`, `satuan`, `gambar`, `status`, `created_at`) VALUES
(1, 'Kue Ulang Tahun', NULL, NULL, 'Kue ulang tahun custom design sesuai permintaan pelanggan. Tersedia berbagai ukuran dan rasa.', 150000.00, 'buah', NULL, 'tersedia', '2026-05-05 17:14:37'),
(2, 'Nasi Box', NULL, NULL, 'Nasi box lengkap dengan lauk pauk pilihan. Cocok untuk acara, meeting, dan gathering.', 25000.00, 'box', NULL, 'tersedia', '2026-05-05 17:14:37'),
(3, 'Katering Harian', NULL, NULL, 'Paket katering makanan harian dengan menu bergizi dan bervariasi setiap harinya.', 35000.00, 'porsi', NULL, 'tersedia', '2026-05-05 17:14:37'),
(4, 'Snack Box', NULL, NULL, 'Snack box berisi berbagai camilan pilihan. Cocok untuk meeting dan acara kantor.', 20000.00, 'box', NULL, 'tersedia', '2026-05-05 17:14:37'),
(5, 'Kue Tart', NULL, NULL, 'Kue tart custom untuk berbagai acara spesial. Bisa request desain dan rasa.', 200000.00, 'buah', NULL, 'tersedia', '2026-05-05 17:14:37'),
(6, 'Paket Katering Acara', NULL, NULL, 'Paket katering lengkap untuk acara pernikahan, ulang tahun, dan acara besar lainnya.', 500000.00, 'paket', NULL, 'tersedia', '2026-05-05 17:14:37'),
(7, 'Bawang Putih', NULL, NULL, 'Pesanan custom dari pelanggan', 500.00, 'pcs', NULL, 'tersedia', '2026-05-06 01:24:56'),
(8, 'Semangka', NULL, NULL, 'Pesanan custom dari pelanggan', 0.00, 'pcs', NULL, 'tersedia', '2026-05-14 14:42:17'),
(9, 'Silverqueen', NULL, NULL, 'Pesanan custom dari pelanggan', 0.00, 'pcs', NULL, 'tersedia', '2026-05-15 07:45:03'),
(10, 'sabun cuci muka', NULL, NULL, 'Pesanan custom dari pelanggan', 0.00, 'pcs', NULL, 'tersedia', '2026-05-15 09:01:40'),
(11, 'Wortel', NULL, NULL, 'Pesanan custom dari pelanggan', 0.00, 'pcs', NULL, 'tersedia', '2026-05-16 08:47:33'),
(12, 'handphone', NULL, NULL, 'Pesanan custom dari pelanggan', 0.00, 'pcs', NULL, 'tersedia', '2026-05-18 01:25:59'),
(13, 'mamammmmmm', 'Elektronik', NULL, 'Pesanan custom dari pelanggan', 0.00, 'pcs', NULL, 'tersedia', '2026-05-19 14:18:26'),
(14, 'asus sofa', 'Elektronik', NULL, 'Pesanan custom dari pelanggan', 0.00, 'pcs', NULL, 'tersedia', '2026-05-19 14:47:58'),
(15, 'Hp bawang', 'Elektronik', NULL, 'Pesanan custom dari pelanggan', 0.00, 'pcs', NULL, 'tersedia', '2026-05-19 15:16:43'),
(16, 'semen buah', 'Material Bangunan', NULL, 'Pesanan custom dari pelanggan', 0.00, 'pcs', NULL, 'tersedia', '2026-05-19 15:24:43'),
(17, 'Kulkas LG', 'Elektronik Rumah Tangga', 'Kulkas', NULL, 0.00, 'pcs', NULL, 'tersedia', '2026-05-20 14:58:00'),
(18, 'Motor Ninja', 'Otomotif', 'Motor', NULL, 0.00, 'pcs', NULL, 'tersedia', '2026-05-20 15:07:00'),
(19, 'HP Iphone 17 Pro Max', 'Elektronik', 'HP', NULL, 0.00, 'pcs', NULL, 'tersedia', '2026-05-20 15:07:00'),
(20, 'Motor Ninja', 'Otomotif', 'Motor', NULL, 0.00, 'pcs', NULL, 'tersedia', '2026-05-21 09:25:10'),
(21, 'Kalung Emas', 'Perhiasan', 'Emas', NULL, 0.00, 'pcs', NULL, 'tersedia', '2026-05-21 09:33:38'),
(22, 'Speaker', 'Elektronik', 'Speaker', NULL, 0.00, 'pcs', NULL, 'tersedia', '2026-05-22 08:38:44'),
(23, 'Meja Makan IKEA', 'Perabot Rumah', 'Meja Makan', NULL, 0.00, 'pcs', NULL, 'tersedia', '2026-05-22 09:03:30'),
(24, 'HP Ip 17 PROMAX', 'Elektronik', 'HP', NULL, 0.00, 'pcs', NULL, 'tersedia', '2026-05-23 11:12:00'),
(25, 'Speaker', 'Elektronik', 'Speaker', NULL, 0.00, 'pcs', NULL, 'tersedia', '2026-05-23 11:12:00');

-- --------------------------------------------------------

--
-- Table structure for table `chat`
--

CREATE TABLE `chat` (
  `id_chat` int(11) NOT NULL,
  `id_pesanan` int(11) NOT NULL,
  `id_pengirim` int(11) NOT NULL,
  `pesan` text NOT NULL,
  `gambar` varchar(255) DEFAULT NULL,
  `waktu` timestamp NOT NULL DEFAULT current_timestamp(),
  `dibaca` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chat`
--

INSERT INTO `chat` (`id_chat`, `id_pesanan`, `id_pengirim`, `pesan`, `gambar`, `waktu`, `dibaca`) VALUES
(1, 1, 2, 'Halo, saya mau tanya soal pesanan kue saya', NULL, '2026-05-05 17:14:37', 1),
(2, 1, 1, 'Halo Budi! Ada yang bisa kami bantu?', NULL, '2026-05-05 17:14:37', 1),
(3, 1, 2, 'Berapa harga kue untuk 50 orang?', NULL, '2026-05-05 17:14:37', 1),
(4, 1, 1, 'Untuk 50 orang harganya Rp 350.000 termasuk dekorasi', NULL, '2026-05-05 17:14:37', 1),
(5, 1, 2, 'Bisa kurang tidak? Budget saya Rp 300.000', NULL, '2026-05-05 17:14:37', 0),
(6, 4, 4, 'Bagaimana dengan harga kue tart saya?', NULL, '2026-05-05 17:14:37', 0),
(7, 4, 1, 'Sedang kami koordinasikan, mohon tunggu ya', NULL, '2026-05-05 17:14:37', 1),
(8, 1, 2, 'p', NULL, '2026-05-06 00:59:36', 0),
(9, 17, 2, 'halo', NULL, '2026-05-16 16:33:28', 0),
(10, 1, 2, 'p', NULL, '2026-05-18 00:28:36', 0),
(11, 18, 2, 'halo', NULL, '2026-05-18 01:26:54', 0),
(12, 26, 2, 'halo', NULL, '2026-05-21 09:31:43', 0),
(13, 26, 2, 'saya mau membahas harga untuk pesanan sya', NULL, '2026-05-21 09:36:33', 0),
(14, 26, 1, 'oke boleh', NULL, '2026-05-22 14:17:36', 0),
(15, 26, 1, 'saya berikan untuk harga nya 30 juta dan 15 juta untuk dp', NULL, '2026-05-22 14:35:12', 0),
(16, 26, 2, 'oke saya setuju', NULL, '2026-05-22 14:35:28', 0),
(17, 26, 2, 'saya mau langsung tanya soal pembayarannya', NULL, '2026-05-22 14:36:13', 0),
(18, 26, 1, 'ok', NULL, '2026-05-22 14:42:57', 0),
(19, 26, 1, 'disini bisa pake qris', NULL, '2026-05-22 14:51:34', 0),
(20, 26, 2, 'oke saya mau itu', NULL, '2026-05-22 14:51:43', 0),
(21, 26, 2, '', '1779462106665-605145000.png', '2026-05-22 15:01:46', 0),
(22, 26, 1, '', '1779462110706-728912887.png', '2026-05-22 15:01:50', 0),
(23, 30, 10, 'halo min', NULL, '2026-05-23 11:13:09', 0),
(24, 30, 1, 'halo juga kak', NULL, '2026-05-23 11:13:15', 0),
(25, 30, 10, 'min saya tawar bisa gak', NULL, '2026-05-23 11:13:40', 0),
(26, 30, 1, 'bisa kak, untuk harga awalnya ada di 35 juta', NULL, '2026-05-23 11:14:06', 0),
(27, 30, 10, 'ok sip', NULL, '2026-05-23 11:14:19', 0),
(28, 30, 1, 'baik, untuk dp kakak cukup membayar setenga dari harga yang distujui ya ka', NULL, '2026-05-23 11:14:47', 0),
(29, 30, 10, 'oke baik kak', NULL, '2026-05-23 11:14:52', 0),
(30, 30, 1, 'ini adalah qris nya ya kak', '1779535175128-817654505.png', '2026-05-23 11:19:35', 0),
(31, 30, 1, 'nanti tanggal jatuh tempo nya tiga hari setelah hari ini ya kak', NULL, '2026-05-23 11:20:20', 0),
(32, 30, 10, 'ohh baik kak', NULL, '2026-05-23 11:20:26', 0),
(33, 30, 10, 'oke sudah kak', NULL, '2026-05-23 11:21:56', 0),
(34, 30, 1, 'oke terima kasih kak', NULL, '2026-05-23 11:22:09', 0),
(35, 30, 1, 'baik kak', NULL, '2026-05-23 11:25:23', 0);

-- --------------------------------------------------------

--
-- Table structure for table `detail_pesanan`
--

CREATE TABLE `detail_pesanan` (
  `id_detail` int(11) NOT NULL,
  `id_pesanan` int(11) NOT NULL,
  `id_barang` int(11) NOT NULL,
  `jumlah` int(11) NOT NULL DEFAULT 1,
  `harga_satuan` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `detail_pesanan`
--

INSERT INTO `detail_pesanan` (`id_detail`, `id_pesanan`, `id_barang`, `jumlah`, `harga_satuan`, `subtotal`, `keterangan`, `kategori_barang`) VALUES
(1, 1, 1, 1, 150000.00, 150000.00, 'Kue ulang tahun custom pink', NULL),
(2, 2, 2, 50, 25000.00, 1250000.00, 'Nasi padang box', NULL),
(3, 3, 4, 30, 20000.00, 600000.00, 'Snack box assorted', NULL),
(4, 4, 5, 1, 200000.00, 200000.00, 'Kue tart desain bunga', NULL),
(5, 5, 3, 25, 35000.00, 875000.00, 'Katering harian 1 minggu', NULL),
(6, 6, 1, 2, 150000.00, 300000.00, 'Kue coklat dan vanilla', NULL),
(7, 7, 6, 1, 500000.00, 500000.00, NULL, NULL),
(8, 8, 7, 50, 500.00, 25000.00, 'Pesanan custom - Bawang Putih', NULL),
(9, 9, 7, 15, 500.00, 7500.00, NULL, NULL),
(14, 14, 8, 5, 0.00, 0.00, 'Pesanan custom - Semangka', NULL),
(15, 15, 9, 5, 0.00, 0.00, 'Pesanan custom - Silverqueen', NULL),
(16, 16, 10, 3, 0.00, 0.00, 'Pesanan custom - sabun cuci muka', NULL),
(17, 17, 11, 5, 0.00, 0.00, 'Pesanan custom - Wortel', NULL),
(18, 18, 12, 10, 0.00, 0.00, 'Pesanan custom - handphone', NULL),
(20, 20, 13, 1, 0.00, 0.00, 'Pesanan custom - mamammmmmm', NULL),
(21, 21, 14, 2, 0.00, 0.00, 'Pesanan custom - asus sofa', NULL),
(22, 22, 15, 1, 0.00, 0.00, 'Pesanan custom - Hp bawang', NULL),
(23, 23, 16, 1, 0.00, 0.00, 'Pesanan custom - semen buah', NULL),
(24, 24, 17, 1, 0.00, 0.00, NULL, NULL),
(25, 25, 18, 1, 0.00, 0.00, NULL, NULL),
(26, 25, 19, 1, 0.00, 0.00, NULL, NULL),
(27, 26, 20, 1, 0.00, 0.00, NULL, NULL),
(28, 27, 21, 1, 0.00, 0.00, NULL, NULL),
(29, 28, 22, 1, 0.00, 0.00, NULL, NULL),
(30, 29, 23, 1, 0.00, 0.00, NULL, NULL),
(31, 30, 24, 1, 35000000.00, 35000000.00, NULL, NULL),
(32, 30, 25, 1, 35000000.00, 35000000.00, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `pelanggan`
--

CREATE TABLE `pelanggan` (
  `id_pelanggan` int(11) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `telepon` varchar(15) DEFAULT NULL,
  `alamat` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('admin','pelanggan') DEFAULT 'pelanggan',
  `status` enum('aktif','nonaktif','ban') DEFAULT 'aktif',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `foto_profil` varchar(255) DEFAULT NULL,
  `kota` varchar(100) DEFAULT NULL,
  `google_id` varchar(100) DEFAULT NULL,
  `provider` enum('local','google') DEFAULT 'local',
  `kecamatan` varchar(100) DEFAULT NULL,
  `kelurahan` varchar(100) DEFAULT NULL,
  `no_rumah` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pelanggan`
--

INSERT INTO `pelanggan` (`id_pelanggan`, `nama`, `email`, `telepon`, `alamat`, `password`, `role`, `status`, `foto`, `created_at`, `updated_at`, `foto_profil`, `kota`, `kode_pos`, `negara`, `google_id`, `provider`, `kecamatan`, `kelurahan`, `no_rumah`) VALUES
(1, 'Admin', 'admin@sipb.com', '081234567890', '', '$2b$10$.R6lrVtd.dkWduBd2NreK.L4kvSbtYM3O.W8/SviE9I8Snq9hvUsC', 'admin', 'aktif', NULL, '2026-05-05 17:14:37', '2026-05-25 03:58:06', NULL, '', NULL, NULL, NULL, 'local', '', '', ''),
(2, 'Budi Santoso', 'budi@email.com', '081234567890', 'Jalan Sam Ratulangi No. 12', '$2a$10$i7MSvrVSmN3Y/P68LMxs3uaybcU5xeK1BhxBRKX9oS6JwT/BgHCMS', 'pelanggan', 'aktif', NULL, '2026-05-05 17:14:37', '2026-05-21 16:45:43', 'profil-1779380618354-355617051.png', 'Kota Manado', '10110', 'Indonesia', NULL, 'local', 'Tikala', 'Taas', '104'),
(3, 'Sari Dewi', 'sari@email.com', '081222222222', 'Jl. Sudirman No.20, Jakarta Barat', '$2b$10$.R6lrVtd.dkWduBd2NreK.L4kvSbtYM3O.W8/SviE9I8Snq9hvUsC', 'pelanggan', 'aktif', NULL, '2026-05-05 17:14:37', '2026-05-05 17:33:13', NULL, NULL, NULL, NULL, NULL, 'local', NULL, NULL, NULL),
(4, 'Andi Wijaya', 'andi@email.com', '081333333333', 'Jl. Gatot Subroto No.5, Jakarta Timur', '$2b$10$.R6lrVtd.dkWduBd2NreK.L4kvSbtYM3O.W8/SviE9I8Snq9hvUsC', 'pelanggan', 'aktif', NULL, '2026-05-05 17:14:37', '2026-05-05 17:33:13', NULL, NULL, NULL, NULL, NULL, 'local', NULL, NULL, NULL),
(5, 'Rina Kusuma', 'rina@email.com', '081444444444', 'Jl. Thamrin No.15, Jakarta Utara', '$2b$10$.R6lrVtd.dkWduBd2NreK.L4kvSbtYM3O.W8/SviE9I8Snq9hvUsC', 'pelanggan', 'aktif', NULL, '2026-05-05 17:14:37', '2026-05-06 00:54:35', NULL, NULL, NULL, NULL, NULL, 'local', NULL, NULL, NULL),
(6, 'Doni Pratama', 'doni@email.com', '081555555555', 'Jl. Rasuna Said No.8, Jakarta', '$2b$10$.R6lrVtd.dkWduBd2NreK.L4kvSbtYM3O.W8/SviE9I8Snq9hvUsC', 'pelanggan', 'ban', NULL, '2026-05-05 17:14:37', '2026-05-08 05:19:47', NULL, NULL, NULL, NULL, NULL, 'local', NULL, NULL, NULL),
(7, 'daniel', 'daniel@gmail.com', NULL, NULL, '$2a$10$1Gk8qqHDutGkLz9X.Lm4aO23lQa1S8fsCdm37.VS//85ZdgvRqNFm', 'pelanggan', 'aktif', NULL, '2026-05-08 05:20:40', '2026-05-08 05:20:40', NULL, NULL, NULL, NULL, NULL, 'local', NULL, NULL, NULL),
(8, 'anonim', 'anonim@gmail.com', NULL, NULL, '$2a$10$XWtE1JZIChTR74RggGB.G.3ds4cqLml/6blNhtEc7bZcIGr3p8A3W', 'pelanggan', 'aktif', NULL, '2026-05-10 08:07:32', '2026-05-10 08:07:32', NULL, NULL, NULL, NULL, NULL, 'local', NULL, NULL, NULL),
(10, 'Nathan Kontu', 'nathanaelkontu@gmail.com', '085212662126', 'Jalan Daan Mogot 1', '$2a$10$hB.78MMVIGK6dMjVWQiAn.cyXgHz65Z9vxq6UKM2oOZFewHAwWxk.', 'pelanggan', 'aktif', NULL, '2026-05-18 10:06:56', '2026-05-23 06:29:17', 'profil-1779443431124-55032673.png', 'Kota Manado', NULL, NULL, '112732391770358344362', 'google', 'Tikala', 'Paal IV', '104'),
(11, 'dr. Zefanya Sondakh, Sp. BTKV., Sp. DVE.', 'zefanyasondakh2007@gmail.com', '08222222222222', NULL, '$2a$10$8JRlguZIWNc.eNAerSNAUOeuqKWekCet4tedw5BlzXkPz5Ndp1AsO', 'admin', 'aktif', NULL, '2026-05-18 10:29:51', '2026-05-18 10:29:51', NULL, NULL, NULL, NULL, NULL, 'local', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `pembayaran`
--

CREATE TABLE `pembayaran` (
  `id_pembayaran` int(11) NOT NULL,
  `id_pesanan` int(11) NOT NULL,
  `jumlah_bayar` decimal(10,2) NOT NULL,
  `metode` enum('transfer','tunai','qris') DEFAULT 'transfer',
  `bukti_bayar` varchar(255) DEFAULT NULL,
  `status` enum('pending','diterima','ditolak') DEFAULT 'pending',
  `catatan` varchar(255) DEFAULT NULL,
  `tanggal_bayar` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pembayaran`
--

INSERT INTO `pembayaran` (`id_pembayaran`, `id_pesanan`, `jumlah_bayar`, `metode`, `bank`, `no_rekening`, `bukti_bayar`, `status`, `catatan`, `tanggal_bayar`) VALUES
(1, 2, 1200000.00, 'transfer', 'BCA', NULL, NULL, 'diterima', 'Transfer sudah dikonfirmasi', '2026-05-05 17:14:37'),
(2, 3, 600000.00, 'tunai', NULL, NULL, NULL, 'diterima', 'Bayar tunai saat pengiriman', '2026-05-05 17:14:37'),
(3, 5, 875000.00, 'qris', NULL, NULL, NULL, 'diterima', 'Pembayaran via QRIS', '2026-05-05 17:14:37');

-- --------------------------------------------------------

--
-- Table structure for table `pesanan`
--

CREATE TABLE `pesanan` (
  `id_pesanan` int(11) NOT NULL,
  `kode_pesanan` varchar(20) NOT NULL,
  `id_pelanggan` int(11) NOT NULL,
  `total_harga` decimal(10,2) NOT NULL DEFAULT 0.00,
  `harga_koordinasi` decimal(10,2) DEFAULT NULL,
  `status` enum('pending','diproses','selesai','verifikasi') DEFAULT 'pending',
  `catatan` text DEFAULT NULL,
  `catatan_admin` text DEFAULT NULL,
  `tanggal_pesan` timestamp NOT NULL DEFAULT current_timestamp(),
  `tanggal_selesai` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pesanan`
--

INSERT INTO `pesanan` (`id_pesanan`, `kode_pesanan`, `id_pelanggan`, `total_harga`, `harga_koordinasi`, `status`, `catatan`, `catatan_admin`, `tanggal_pesan`, `tanggal_selesai`, `updated_at`) VALUES
(1, 'ORD-2026-0001', 2, 150000.00, 150000.00, 'pending', 'Tulisan Happy Birthday Andi, warna pink', NULL, '2026-05-05 17:14:37', NULL, '2026-05-15 09:00:51'),
(2, 'ORD-2026-0002', 3, 1250000.00, 1200000.00, 'verifikasi', 'Untuk acara kantor 50 orang, minta nasi padang', NULL, '2026-05-05 17:14:37', NULL, '2026-05-15 09:00:51'),
(3, 'ORD-2026-0003', 2, 600000.00, 600000.00, 'selesai', 'Snack box untuk meeting bulanan 30 orang', 'Pesanan selesai dan sudah dikirim', '2026-05-05 17:14:37', NULL, '2026-05-15 09:00:51'),
(4, 'ORD-2026-0004', 4, 200000.00, NULL, 'verifikasi', 'Kue tart untuk anniversary, desain bunga', 'Menunggu konfirmasi harga dari pelanggan', '2026-05-05 17:14:37', NULL, '2026-05-15 09:00:51'),
(5, 'ORD-2026-0005', 3, 875000.00, 875000.00, 'selesai', 'Katering harian untuk 25 orang selama 1 minggu', 'Pesanan selesai tepat waktu', '2026-05-05 17:14:37', NULL, '2026-05-15 09:00:51'),
(6, 'ORD-2026-0006', 2, 300000.00, NULL, 'pending', 'Kue ulang tahun 2 buah, rasa coklat dan vanilla', NULL, '2026-05-05 17:14:37', NULL, '2026-05-15 09:00:51'),
(7, 'ORD-2026-0007', 2, 500000.00, NULL, 'pending', NULL, NULL, '2026-05-06 01:02:15', NULL, '2026-05-15 09:00:51'),
(8, 'ORD-2026-0008', 2, 25000.00, NULL, 'selesai', '[PESANAN CUSTOM] Barang: Bawang Putih | Estimasi harga: Rp 500', NULL, '2026-05-06 01:24:56', '2026-05-06 11:27:25', '2026-05-15 09:00:51'),
(9, 'ORD-2026-0009', 2, 7500.00, NULL, 'diproses', 'PESANAN CUSTOM: jeruk\nDetail: dalam keadaan sudah dikupas\nPerkiraan harga: Rp 45.000', NULL, '2026-05-07 04:10:13', '2026-05-10 13:11:34', '2026-05-15 09:00:51'),
(14, 'ORD-2026-0014', 2, 0.00, NULL, 'diproses', '[PESANAN CUSTOM] Barang: Semangka | Harga: Mohon dikonfirmasi admin | Catatan: dalam kilogram', 'Harga disepakati: Rp 50.000 | DP: Rp 25.000 | Jatuh Tempo: 2026-05-21', '2026-05-14 14:46:35', NULL, '2026-05-15 09:00:51'),
(15, 'ORD-2026-0015', 2, 0.00, NULL, 'pending', '[PESANAN CUSTOM] Barang: Silverqueen | Harga: Mohon dikonfirmasi admin | Catatan: beli di freshmart', NULL, '2026-05-15 07:45:03', NULL, '2026-05-15 09:00:51'),
(16, 'ORD-2026-0016', 2, 0.00, NULL, 'pending', '[PESANAN CUSTOM] Barang: sabun cuci muka | Harga: Mohon dikonfirmasi admin', NULL, '2026-05-15 09:01:40', NULL, '2026-05-15 09:01:40'),
(17, 'ORD-2026-0017', 2, 0.00, NULL, 'pending', '[PESANAN CUSTOM] Barang: Wortel | Harga: Mohon dikonfirmasi admin | Catatan: 5 kilogram', NULL, '2026-05-16 08:47:33', NULL, '2026-05-16 08:47:33'),
(18, 'ORD-2026-0018', 2, 0.00, NULL, 'pending', '[PESANAN CUSTOM] Barang: handphone | Harga: Mohon dikonfirmasi admin | Catatan: aaaaaaaaaaaaaaa', NULL, '2026-05-18 01:25:59', NULL, '2026-05-18 01:25:59'),
(20, 'ORD-2026-0019', 2, 0.00, NULL, 'pending', '[PESANAN CUSTOM] Barang: mamammmmmm | Kategori: Elektronik | Harga: Mohon dikonfirmasi admin', NULL, '2026-05-19 14:18:26', NULL, '2026-05-19 14:18:26'),
(21, 'ORD-2026-0021', 2, 0.00, NULL, 'pending', '[PESANAN CUSTOM] Barang: asus sofa | Kategori: Elektronik | Harga: Mohon dikonfirmasi admin', NULL, '2026-05-19 14:47:58', NULL, '2026-05-19 14:47:58'),
(22, 'ORD-2026-0022', 2, 0.00, NULL, 'pending', '[PESANAN CUSTOM] Barang: Hp bawang | Kategori: Elektronik | Harga: Mohon dikonfirmasi admin', NULL, '2026-05-19 15:16:43', NULL, '2026-05-19 15:16:43'),
(23, 'ORD-2026-0023', 2, 0.00, NULL, 'pending', '[PESANAN CUSTOM] Barang: semen buah | Kategori: Material Bangunan | Harga: Mohon dikonfirmasi admin', NULL, '2026-05-19 15:24:43', NULL, '2026-05-19 15:24:43'),
(24, 'ORD-2026-0024', 2, 0.00, NULL, 'pending', NULL, NULL, '2026-05-20 14:58:00', NULL, '2026-05-20 14:58:00'),
(25, 'ORD-2026-0025', 2, 0.00, NULL, 'pending', NULL, NULL, '2026-05-20 15:07:00', NULL, '2026-05-20 15:07:00'),
(26, 'ORD-2026-0026', 2, 0.00, NULL, 'pending', NULL, NULL, '2026-05-21 09:25:10', NULL, '2026-05-21 09:25:10'),
(27, 'ORD-2026-0027', 2, 0.00, NULL, 'pending', NULL, NULL, '2026-05-21 09:33:38', NULL, '2026-05-21 09:33:38'),
(28, 'ORD-2026-0028', 2, 0.00, NULL, 'pending', 'AAAAAAAAAAAAAAaaaaaaa', NULL, '2026-05-22 08:38:44', NULL, '2026-05-22 08:38:44'),
(29, 'ORD-2026-0029', 2, 0.00, NULL, 'pending', 'AaaAAaaaaaBBBBbb', NULL, '2026-05-22 09:03:30', NULL, '2026-05-22 09:03:30'),
(30, 'ORD-2026-0030', 10, 35000000.00, 35000000.00, 'selesai', 'beli semua di toko eraphone', NULL, '2026-05-23 11:12:00', '2026-05-24 12:48:03', '2026-05-24 12:48:03');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `barang`
--
ALTER TABLE `barang`
  ADD PRIMARY KEY (`id_barang`);

--
-- Indexes for table `chat`
--
ALTER TABLE `chat`
  ADD PRIMARY KEY (`id_chat`),
  ADD KEY `id_pesanan` (`id_pesanan`),
  ADD KEY `id_pengirim` (`id_pengirim`);

--
-- Indexes for table `detail_pesanan`
--
ALTER TABLE `detail_pesanan`
  ADD PRIMARY KEY (`id_detail`),
  ADD KEY `id_pesanan` (`id_pesanan`),
  ADD KEY `id_barang` (`id_barang`);

--
-- Indexes for table `pelanggan`
--
ALTER TABLE `pelanggan`
  ADD PRIMARY KEY (`id_pelanggan`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `unique_email` (`email`);

--
-- Indexes for table `pembayaran`
--
ALTER TABLE `pembayaran`
  ADD PRIMARY KEY (`id_pembayaran`),
  ADD KEY `id_pesanan` (`id_pesanan`);

--
-- Indexes for table `pesanan`
--
ALTER TABLE `pesanan`
  ADD PRIMARY KEY (`id_pesanan`),
  ADD UNIQUE KEY `kode_pesanan` (`kode_pesanan`),
  ADD KEY `id_pelanggan` (`id_pelanggan`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `barang`
--
ALTER TABLE `barang`
  MODIFY `id_barang` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `chat`
--
ALTER TABLE `chat`
  MODIFY `id_chat` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `detail_pesanan`
--
ALTER TABLE `detail_pesanan`
  MODIFY `id_detail` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `pelanggan`
--
ALTER TABLE `pelanggan`
  MODIFY `id_pelanggan` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `pembayaran`
--
ALTER TABLE `pembayaran`
  MODIFY `id_pembayaran` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `pesanan`
--
ALTER TABLE `pesanan`
  MODIFY `id_pesanan` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `chat`
--
ALTER TABLE `chat`
  ADD CONSTRAINT `chat_ibfk_1` FOREIGN KEY (`id_pesanan`) REFERENCES `pesanan` (`id_pesanan`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_ibfk_2` FOREIGN KEY (`id_pengirim`) REFERENCES `pelanggan` (`id_pelanggan`) ON DELETE CASCADE;

--
-- Constraints for table `detail_pesanan`
--
ALTER TABLE `detail_pesanan`
  ADD CONSTRAINT `detail_pesanan_ibfk_1` FOREIGN KEY (`id_pesanan`) REFERENCES `pesanan` (`id_pesanan`) ON DELETE CASCADE,
  ADD CONSTRAINT `detail_pesanan_ibfk_2` FOREIGN KEY (`id_barang`) REFERENCES `barang` (`id_barang`);

--
-- Constraints for table `pembayaran`
--
ALTER TABLE `pembayaran`
  ADD CONSTRAINT `pembayaran_ibfk_1` FOREIGN KEY (`id_pesanan`) REFERENCES `pesanan` (`id_pesanan`) ON DELETE CASCADE;

--
-- Constraints for table `pesanan`
--
ALTER TABLE `pesanan`
  ADD CONSTRAINT `pesanan_ibfk_1` FOREIGN KEY (`id_pelanggan`) REFERENCES `pelanggan` (`id_pelanggan`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
