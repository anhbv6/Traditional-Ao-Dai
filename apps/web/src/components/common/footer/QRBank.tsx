type QRBankProps = {
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  qrUrl?: string;
};

export function QRBank({
  bankName = 'MB BANK',
  accountNumber = '123456789999',
  accountHolder = 'NGUYEN VAN A',
  qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://qr.sepay.vn/img/qr.png',
}: QRBankProps) {
  return (
    <div className="cursor-pointer flex flex-col items-center rounded-xl max-w-[180px] w-full transition-transform hover:scale-[1.02] duration-300">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg flex items-center justify-center p-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrUrl}
          alt={`${bankName} QR Code`}
          width={150}
          height={150}
          className="h-full w-full object-contain mix-blend-multiply"
        />
      </div>
      <div className="text-center text-[10px] leading-relaxed text-muted-foreground w-full">
        <p className="font-bold text-primary tracking-wide">{bankName}</p>
        <p className="font-mono mt-0.5 tracking-wider text-foreground font-semibold">
          {accountNumber}
        </p>
        <p className="font-[family-name:var(--font-lora)] uppercase mt-0.5 text-[9px] font-semibold tracking-wider text-muted-foreground/80">
          {accountHolder}
        </p>
      </div>
    </div>
  );
}
