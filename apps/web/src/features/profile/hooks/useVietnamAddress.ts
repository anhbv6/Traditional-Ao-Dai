"use client";

import { useQuery } from "@tanstack/react-query";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface VNProvince {
  name: string;
  code: number;
  division_type?: string;
  codename?: string;
  phone_code?: number;
}

export interface VNDistrict {
  name: string;
  code: number;
  division_type?: string;
  codename?: string;
  province_code?: number;
}

export interface VNWard {
  name: string;
  code: number;
  division_type?: string;
  codename?: string;
  district_code?: number;
}

interface ProvinceApiResponse extends VNProvince {
  districts?: VNDistrict[];
}

interface DistrictApiResponse extends VNDistrict {
  wards?: VNWard[];
}

// ─── API Base ───────────────────────────────────────────────────────────────────
// Sử dụng API v1 (provinces.open-api.vn/api) để giữ mô hình 3 cấp (Tỉnh/Thành -> Quận/Huyện -> Phường/Xã).
// API v2 đã chuyển thành mô hình 2 cấp (Tỉnh/Thành -> Phường/Xã) nên không còn endpoint /v2/d/{code}.
const VN_API_BASE = "https://provinces.open-api.vn/api";

async function fetchProvinces(): Promise<VNProvince[]> {
  const res = await fetch(`${VN_API_BASE}/p/`);
  if (!res.ok) throw new Error("Failed to fetch provinces");
  return res.json();
}

async function fetchDistricts(provinceCode: number): Promise<VNDistrict[]> {
  if (!provinceCode) return [];
  const res = await fetch(`${VN_API_BASE}/p/${provinceCode}?depth=2`);
  if (!res.ok) throw new Error("Failed to fetch districts");
  const data: ProvinceApiResponse = await res.json();
  return data.districts || [];
}

async function fetchWards(districtCode: number): Promise<VNWard[]> {
  if (!districtCode) return [];
  const res = await fetch(`${VN_API_BASE}/d/${districtCode}?depth=2`);
  if (!res.ok) throw new Error("Failed to fetch wards");
  const data: DistrictApiResponse = await res.json();
  return data.wards || [];
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

export function useVietnamAddress(
  provinceCodeOrName: string,
  districtCodeOrName: string
) {
  // 1. Provinces – cached long term
  const {
    data: provinces = [],
    isLoading: isLoadingProvinces,
  } = useQuery<VNProvince[]>({
    queryKey: ["vnProvinces"],
    queryFn: fetchProvinces,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Resolve target province numeric code from name or code string
  const targetProvince = provinces.find(
    (p) =>
      p.name === provinceCodeOrName ||
      String(p.code) === provinceCodeOrName
  );
  const resolvedProvinceCode = targetProvince
    ? targetProvince.code
    : !isNaN(Number(provinceCodeOrName)) && Number(provinceCodeOrName) > 0
    ? Number(provinceCodeOrName)
    : 0;

  // 2. Districts – fetched when a province is selected
  const {
    data: districts = [],
    isLoading: isLoadingDistricts,
  } = useQuery<VNDistrict[]>({
    queryKey: ["vnDistricts", resolvedProvinceCode],
    queryFn: () => fetchDistricts(resolvedProvinceCode),
    enabled: resolvedProvinceCode > 0,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
  });

  // Resolve target district numeric code from name or code string
  const targetDistrict = districts.find(
    (d) =>
      d.name === districtCodeOrName ||
      String(d.code) === districtCodeOrName
  );
  const resolvedDistrictCode = targetDistrict
    ? targetDistrict.code
    : !isNaN(Number(districtCodeOrName)) && Number(districtCodeOrName) > 0
    ? Number(districtCodeOrName)
    : 0;

  // 3. Wards – fetched when a district is selected
  const {
    data: wards = [],
    isLoading: isLoadingWards,
  } = useQuery<VNWard[]>({
    queryKey: ["vnWards", resolvedDistrictCode],
    queryFn: () => fetchWards(resolvedDistrictCode),
    enabled: resolvedDistrictCode > 0,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
  });

  return {
    provinces,
    districts,
    wards,
    isLoadingProvinces,
    isLoadingDistricts,
    isLoadingWards,
  };
}
