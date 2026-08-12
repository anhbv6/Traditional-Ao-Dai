Cấu hình tạo key JWT RS256 bất đối xứng của JWT_PRIVATE_KEY và JWT_PUBLIC_KEY
- private.pem (dùng để ký token) lệnh:
openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:2048

- public.pem (dùng để xác thực token) lệnh:
openssl rsa -in private.pem -pubout -out public.pem

convert mã của private.pem và public.pem sang Base64:
1. private.pem lệnh:
cat private.pem | base64 -w 0
echo ""

2. public.pem lệnh:
cat public.pem | base64 -w 0
echo ""

