const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Survey = require('../models/Survey');

// Survey data from the original dummy data
const surveyData = [
  // Chennai District
  // 1. Ariyalur
  { surveyNumber: 'TN/ARL/2023/001', district: 'Ariyalur', taluk: 'Ariyalur', valid: true },
  { surveyNumber: 'TN/ARL/2023/002', district: 'Ariyalur', taluk: 'Sendurai', valid: true },
  { surveyNumber: 'TN/ARL/2023/003', district: 'Ariyalur', taluk: 'Udayarpalayam', valid: true },
  { surveyNumber: 'TN/ARL/2023/004', district: 'Ariyalur', taluk: 'Jayankondam', valid: true },
  { surveyNumber: 'TN/ARL/2023/005', district: 'Ariyalur', taluk: 'Andimadam', valid: true },

  // 2. Chengalpattu
  { surveyNumber: 'TN/CHG/2023/001', district: 'Chengalpattu', taluk: 'Tambaram', valid: true },
  { surveyNumber: 'TN/CHG/2023/002', district: 'Chengalpattu', taluk: 'Thiruporur', valid: true },
  { surveyNumber: 'TN/CHG/2023/003', district: 'Chengalpattu', taluk: 'Madurantakam', valid: true },
  { surveyNumber: 'TN/CHG/2023/004', district: 'Chengalpattu', taluk: 'Chengalpattu', valid: true },
  { surveyNumber: 'TN/CHG/2023/005', district: 'Chengalpattu', taluk: 'Cheyyur', valid: true },

  // 3. Chennai
  { surveyNumber: 'TN/CHN/2023/001', district: 'Chennai', taluk: 'Ambattur', valid: true },
  { surveyNumber: 'TN/CHN/2023/002', district: 'Chennai', taluk: 'Alandur', valid: true },
  { surveyNumber: 'TN/CHN/2023/003', district: 'Chennai', taluk: 'Perambur', valid: true },
  { surveyNumber: 'TN/CHN/2023/004', district: 'Chennai', taluk: 'Madhavaram', valid: true },
  { surveyNumber: 'TN/CHN/2023/005', district: 'Chennai', taluk: 'Tondiarpet', valid: true },

  // 4. Coimbatore
  { surveyNumber: 'TN/CBE/2023/001', district: 'Coimbatore', taluk: 'Coimbatore North', valid: true },
  { surveyNumber: 'TN/CBE/2023/002', district: 'Coimbatore', taluk: 'Coimbatore South', valid: true },
  { surveyNumber: 'TN/CBE/2023/003', district: 'Coimbatore', taluk: 'Pollachi', valid: true },
  { surveyNumber: 'TN/CBE/2023/004', district: 'Coimbatore', taluk: 'Palladam', valid: true },
  { surveyNumber: 'TN/CBE/2023/005', district: 'Coimbatore', taluk: 'Mettupalayam', valid: true },

  // 5. Cuddalore
  { surveyNumber: 'TN/CDL/2023/001', district: 'Cuddalore', taluk: 'Cuddalore', valid: true },
  { surveyNumber: 'TN/CDL/2023/002', district: 'Cuddalore', taluk: 'Panruti', valid: true },
  { surveyNumber: 'TN/CDL/2023/003', district: 'Cuddalore', taluk: 'Chidambaram', valid: true },
  { surveyNumber: 'TN/CDL/2023/004', district: 'Cuddalore', taluk: 'Virudhachalam', valid: true },
  { surveyNumber: 'TN/CDL/2023/005', district: 'Cuddalore', taluk: 'Kattumannarkoil', valid: true },

  // 6. Dharmapuri
  { surveyNumber: 'TN/DPI/2023/001', district: 'Dharmapuri', taluk: 'Dharmapuri', valid: true },
  { surveyNumber: 'TN/DPI/2023/002', district: 'Dharmapuri', taluk: 'Harur', valid: true },
  { surveyNumber: 'TN/DPI/2023/003', district: 'Dharmapuri', taluk: 'Pappireddipatti', valid: true },
  { surveyNumber: 'TN/DPI/2023/004', district: 'Dharmapuri', taluk: 'Palacode', valid: true },
  { surveyNumber: 'TN/DPI/2023/005', district: 'Dharmapuri', taluk: 'Pennagaram', valid: true },

  // 7. Dindigul
  { surveyNumber: 'TN/DGL/2023/001', district: 'Dindigul', taluk: 'Dindigul', valid: true },
  { surveyNumber: 'TN/DGL/2023/002', district: 'Dindigul', taluk: 'Palani', valid: true },
  { surveyNumber: 'TN/DGL/2023/003', district: 'Dindigul', taluk: 'Oddanchatram', valid: true },
  { surveyNumber: 'TN/DGL/2023/004', district: 'Dindigul', taluk: 'Nilakottai', valid: true },
  { surveyNumber: 'TN/DGL/2023/005', district: 'Dindigul', taluk: 'Natham', valid: true },

  // 8. Erode
  { surveyNumber: 'TN/ERD/2023/001', district: 'Erode', taluk: 'Erode', valid: true },
  { surveyNumber: 'TN/ERD/2023/002', district: 'Erode', taluk: 'Gobichettipalayam', valid: true },
  { surveyNumber: 'TN/ERD/2023/003', district: 'Erode', taluk: 'Perundurai', valid: true },
  { surveyNumber: 'TN/ERD/2023/004', district: 'Erode', taluk: 'Sathyamangalam', valid: true },
  { surveyNumber: 'TN/ERD/2023/005', district: 'Erode', taluk: 'Bhavani', valid: true },

  // 9. Kallakurichi
  { surveyNumber: 'TN/KLK/2023/001', district: 'Kallakurichi', taluk: 'Kallakurichi', valid: true },
  { surveyNumber: 'TN/KLK/2023/002', district: 'Kallakurichi', taluk: 'Ulundurpet', valid: true },
  { surveyNumber: 'TN/KLK/2023/003', district: 'Kallakurichi', taluk: 'Chinnasalem', valid: true },
  { surveyNumber: 'TN/KLK/2023/004', district: 'Kallakurichi', taluk: 'Sankarapuram', valid: true },
  { surveyNumber: 'TN/KLK/2023/005', district: 'Kallakurichi', taluk: 'Tirukkoyilur', valid: true },

  // 10. Kanchipuram
  { surveyNumber: 'TN/KPM/2023/001', district: 'Kanchipuram', taluk: 'Kanchipuram', valid: true },
  { surveyNumber: 'TN/KPM/2023/002', district: 'Kanchipuram', taluk: 'Sriperumbudur', valid: true },
  { surveyNumber: 'TN/KPM/2023/003', district: 'Kanchipuram', taluk: 'Uthiramerur', valid: true },
  { surveyNumber: 'TN/KPM/2023/004', district: 'Kanchipuram', taluk: 'Walajabad', valid: true },
  { surveyNumber: 'TN/KPM/2023/005', district: 'Kanchipuram', taluk: 'Madurantakam', valid: true },

  // 11. Kanyakumari
  { surveyNumber: 'TN/KKD/2023/001', district: 'Kanyakumari', taluk: 'Nagercoil', valid: true },
  { surveyNumber: 'TN/KKD/2023/002', district: 'Kanyakumari', taluk: 'Padmanabhapuram', valid: true },
  { surveyNumber: 'TN/KKD/2023/003', district: 'Kanyakumari', taluk: 'Thovalai', valid: true },
  { surveyNumber: 'TN/KKD/2023/004', district: 'Kanyakumari', taluk: 'Vilavancode', valid: true },
  { surveyNumber: 'TN/KKD/2023/005', district: 'Kanyakumari', taluk: 'Agasteeswaram', valid: true },

  // 12. Karur
  { surveyNumber: 'TN/KRR/2023/001', district: 'Karur', taluk: 'Karur', valid: true },
  { surveyNumber: 'TN/KRR/2023/002', district: 'Karur', taluk: 'Aravakurichi', valid: true },
  { surveyNumber: 'TN/KRR/2023/003', district: 'Karur', taluk: 'Kulithalai', valid: true },
  { surveyNumber: 'TN/KRR/2023/004', district: 'Karur', taluk: 'Krishnarayapuram', valid: true },
  { surveyNumber: 'TN/KRR/2023/005', district: 'Karur', taluk: 'Pugalur', valid: true },

  // 13. Krishnagiri
  { surveyNumber: 'TN/KGI/2023/001', district: 'Krishnagiri', taluk: 'Krishnagiri', valid: true },
  { surveyNumber: 'TN/KGI/2023/002', district: 'Krishnagiri', taluk: 'Hosur', valid: true },
  { surveyNumber: 'TN/KGI/2023/003', district: 'Krishnagiri', taluk: 'Denkanikottai', valid: true },
  { surveyNumber: 'TN/KGI/2023/004', district: 'Krishnagiri', taluk: 'Pochampalli', valid: true },
  { surveyNumber: 'TN/KGI/2023/005', district: 'Krishnagiri', taluk: 'Uthangarai', valid: true },

  // 14. Madurai
  { surveyNumber: 'TN/MDU/2023/001', district: 'Madurai', taluk: 'Madurai East', valid: true },
  { surveyNumber: 'TN/MDU/2023/002', district: 'Madurai', taluk: 'Madurai West', valid: true },
  { surveyNumber: 'TN/MDU/2023/003', district: 'Madurai', taluk: 'Thirumangalam', valid: true },
  { surveyNumber: 'TN/MDU/2023/004', district: 'Madurai', taluk: 'Usilampatti', valid: true },
  { surveyNumber: 'TN/MDU/2023/005', district: 'Madurai', taluk: 'Melur', valid: true },

  // 15. Mayiladuthurai
  { surveyNumber: 'TN/MLD/2023/001', district: 'Mayiladuthurai', taluk: 'Mayiladuthurai', valid: true },
  { surveyNumber: 'TN/MLD/2023/002', district: 'Mayiladuthurai', taluk: 'Sirkazhi', valid: true },
  { surveyNumber: 'TN/MLD/2023/003', district: 'Mayiladuthurai', taluk: 'Kuthalam', valid: true },
  { surveyNumber: 'TN/MLD/2023/004', district: 'Mayiladuthurai', taluk: 'Tharangambadi', valid: true },
  { surveyNumber: 'TN/MLD/2023/005', district: 'Mayiladuthurai', taluk: 'Manalmedu', valid: true },

  // 16. Nagapattinam
  { surveyNumber: 'TN/NGP/2023/001', district: 'Nagapattinam', taluk: 'Nagapattinam', valid: true },
  { surveyNumber: 'TN/NGP/2023/002', district: 'Nagapattinam', taluk: 'Kilvelur', valid: true },
  { surveyNumber: 'TN/NGP/2023/003', district: 'Nagapattinam', taluk: 'Thirukkuvalai', valid: true },
  { surveyNumber: 'TN/NGP/2023/004', district: 'Nagapattinam', taluk: 'Vedaranyam', valid: true },
  { surveyNumber: 'TN/NGP/2023/005', district: 'Nagapattinam', taluk: 'Mayiladuthurai', valid: true },

  // 17. Namakkal
  { surveyNumber: 'TN/NMK/2023/001', district: 'Namakkal', taluk: 'Namakkal', valid: true },
  { surveyNumber: 'TN/NMK/2023/002', district: 'Namakkal', taluk: 'Tiruchengode', valid: true },
  { surveyNumber: 'TN/NMK/2023/003', district: 'Namakkal', taluk: 'Rasipuram', valid: true },
  { surveyNumber: 'TN/NMK/2023/004', district: 'Namakkal', taluk: 'Kolli Hills', valid: true },
  { surveyNumber: 'TN/NMK/2023/005', district: 'Namakkal', taluk: 'Paramathi', valid: true },

  // 18. Nilgiris
  { surveyNumber: 'TN/NLG/2023/001', district: 'Nilgiris', taluk: 'Udhagamandalam', valid: true },
  { surveyNumber: 'TN/NLG/2023/002', district: 'Nilgiris', taluk: 'Coonoor', valid: true },
  { surveyNumber: 'TN/NLG/2023/003', district: 'Nilgiris', taluk: 'Kotagiri', valid: true },
  { surveyNumber: 'TN/NLG/2023/004', district: 'Nilgiris', taluk: 'Gudalur', valid: true },
  { surveyNumber: 'TN/NLG/2023/005', district: 'Nilgiris', taluk: 'Pandalur', valid: true },

  // 19. Perambalur
  { surveyNumber: 'TN/PMB/2023/001', district: 'Perambalur', taluk: 'Perambalur', valid: true },
  { surveyNumber: 'TN/PMB/2023/002', district: 'Perambalur', taluk: 'Veppanthattai', valid: true },
  { surveyNumber: 'TN/PMB/2023/003', district: 'Perambalur', taluk: 'Kunnam', valid: true },
  { surveyNumber: 'TN/PMB/2023/004', district: 'Perambalur', taluk: 'Alathur', valid: true },
  { surveyNumber: 'TN/PMB/2023/005', district: 'Perambalur', taluk: 'Labbaikudikadu', valid: true },

  // 20. Pudukkottai
  { surveyNumber: 'TN/PDK/2023/001', district: 'Pudukkottai', taluk: 'Pudukkottai', valid: true },
  { surveyNumber: 'TN/PDK/2023/002', district: 'Pudukkottai', taluk: 'Aranthangi', valid: true },
  { surveyNumber: 'TN/PDK/2023/003', district: 'Pudukkottai', taluk: 'Gandarvakottai', valid: true },
  { surveyNumber: 'TN/PDK/2023/004', district: 'Pudukkottai', taluk: 'Iluppur', valid: true },
  { surveyNumber: 'TN/PDK/2023/005', district: 'Pudukkottai', taluk: 'Alangudi', valid: true },

  // 21. Ramanathapuram
  { surveyNumber: 'TN/RMN/2023/001', district: 'Ramanathapuram', taluk: 'Ramanathapuram', valid: true },
  { surveyNumber: 'TN/RMN/2023/002', district: 'Ramanathapuram', taluk: 'Paramakudi', valid: true },
  { surveyNumber: 'TN/RMN/2023/003', district: 'Ramanathapuram', taluk: 'Rameswaram', valid: true },
  { surveyNumber: 'TN/RMN/2023/004', district: 'Ramanathapuram', taluk: 'Mudukulathur', valid: true },
  { surveyNumber: 'TN/RMN/2023/005', district: 'Ramanathapuram', taluk: 'Kadaladi', valid: true },

  // 22. Ranipet
  { surveyNumber: 'TN/RPT/2023/001', district: 'Ranipet', taluk: 'Ranipet', valid: true },
  { surveyNumber: 'TN/RPT/2023/002', district: 'Ranipet', taluk: 'Arcot', valid: true },
  { surveyNumber: 'TN/RPT/2023/003', district: 'Ranipet', taluk: 'Walajah', valid: true },
  { surveyNumber: 'TN/RPT/2023/004', district: 'Ranipet', taluk: 'Arakkonam', valid: true },
  { surveyNumber: 'TN/RPT/2023/005', district: 'Ranipet', taluk: 'Kalavai', valid: true },

  // 23. Salem
  { surveyNumber: 'TN/SLM/2023/001', district: 'Salem', taluk: 'Salem', valid: true },
  { surveyNumber: 'TN/SLM/2023/002', district: 'Salem', taluk: 'Mettur', valid: true },
  { surveyNumber: 'TN/SLM/2023/003', district: 'Salem', taluk: 'Attur', valid: true },
  { surveyNumber: 'TN/SLM/2023/004', district: 'Salem', taluk: 'Sankari', valid: true },
  { surveyNumber: 'TN/SLM/2023/005', district: 'Salem', taluk: 'Yercaud', valid: true },

  // 24. Sivaganga
  { surveyNumber: 'TN/SVG/2023/001', district: 'Sivaganga', taluk: 'Sivaganga', valid: true },
  { surveyNumber: 'TN/SVG/2023/002', district: 'Sivaganga', taluk: 'Karaikudi', valid: true },
  { surveyNumber: 'TN/SVG/2023/003', district: 'Sivaganga', taluk: 'Devakottai', valid: true },
  { surveyNumber: 'TN/SVG/2023/004', district: 'Sivaganga', taluk: 'Manamadurai', valid: true },
  { surveyNumber: 'TN/SVG/2023/005', district: 'Sivaganga', taluk: 'Ilayankudi', valid: true },

  // 25. Thanjavur
  { surveyNumber: 'TN/TNJ/2023/001', district: 'Thanjavur', taluk: 'Thanjavur', valid: true },
  { surveyNumber: 'TN/TNJ/2023/002', district: 'Thanjavur', taluk: 'Pattukkottai', valid: true },
  { surveyNumber: 'TN/TNJ/2023/003', district: 'Thanjavur', taluk: 'Orathanadu', valid: true },
  { surveyNumber: 'TN/TNJ/2023/004', district: 'Thanjavur', taluk: 'Kumbakonam', valid: true },
  { surveyNumber: 'TN/TNJ/2023/005', district: 'Thanjavur', taluk: 'Peravurani', valid: true },

  // 26. Theni
  { surveyNumber: 'TN/THN/2023/001', district: 'Theni', taluk: 'Theni', valid: true },
  { surveyNumber: 'TN/THN/2023/002', district: 'Theni', taluk: 'Bodinayakkanur', valid: true },
  { surveyNumber: 'TN/THN/2023/003', district: 'Theni', taluk: 'Periyakulam', valid: true },
  { surveyNumber: 'TN/THN/2023/004', district: 'Theni', taluk: 'Uthamapalayam', valid: true },
  { surveyNumber: 'TN/THN/2023/005', district: 'Theni', taluk: 'Andipatti', valid: true },

  // 27. Thoothukudi
  { surveyNumber: 'TN/TTK/2023/001', district: 'Thoothukudi', taluk: 'Thoothukudi', valid: true },
  { surveyNumber: 'TN/TTK/2023/002', district: 'Thoothukudi', taluk: 'Tiruchendur', valid: true },
  { surveyNumber: 'TN/TTK/2023/003', district: 'Thoothukudi', taluk: 'Kovilpatti', valid: true },
  { surveyNumber: 'TN/TTK/2023/004', district: 'Thoothukudi', taluk: 'Sathankulam', valid: true },
  { surveyNumber: 'TN/TTK/2023/005', district: 'Thoothukudi', taluk: 'Vilathikulam', valid: true },

  // 28. Tiruchirappalli
  { surveyNumber: 'TN/TRC/2023/001', district: 'Tiruchirappalli', taluk: 'Srirangam', valid: true },
  { surveyNumber: 'TN/TRC/2023/002', district: 'Tiruchirappalli', taluk: 'Lalgudi', valid: true },
  { surveyNumber: 'TN/TRC/2023/003', district: 'Tiruchirappalli', taluk: 'Musiri', valid: true },
  { surveyNumber: 'TN/TRC/2023/004', district: 'Tiruchirappalli', taluk: 'Thuraiyur', valid: true },
  { surveyNumber: 'TN/TRC/2023/005', district: 'Tiruchirappalli', taluk: 'Manapparai', valid: true },

  // 29. Tirunelveli
  { surveyNumber: 'TN/TVL/2023/001', district: 'Tirunelveli', taluk: 'Tirunelveli', valid: true },
  { surveyNumber: 'TN/TVL/2023/002', district: 'Tirunelveli', taluk: 'Palayamkottai', valid: true },
  { surveyNumber: 'TN/TVL/2023/003', district: 'Tirunelveli', taluk: 'Ambasamudram', valid: true },
  { surveyNumber: 'TN/TVL/2023/004', district: 'Tirunelveli', taluk: 'Nanguneri', valid: true },
  { surveyNumber: 'TN/TVL/2023/005', district: 'Tirunelveli', taluk: 'Radhapuram', valid: true },

  // 30. Tiruppur
  { surveyNumber: 'TN/TUP/2023/001', district: 'Tiruppur', taluk: 'Tiruppur North', valid: true },
  { surveyNumber: 'TN/TUP/2023/002', district: 'Tiruppur', taluk: 'Tiruppur South', valid: true },
  { surveyNumber: 'TN/TUP/2023/003', district: 'Tiruppur', taluk: 'Dharapuram', valid: true },
  { surveyNumber: 'TN/TUP/2023/004', district: 'Tiruppur', taluk: 'Palladam', valid: true },
  { surveyNumber: 'TN/TUP/2023/005', district: 'Tiruppur', taluk: 'Avinashi', valid: true },

  // 31. Tiruvallur
  { surveyNumber: 'TN/TVR/2023/001', district: 'Tiruvallur', taluk: 'Tiruvallur', valid: true },
  { surveyNumber: 'TN/TVR/2023/002', district: 'Tiruvallur', taluk: 'Poonamallee', valid: true },
  { surveyNumber: 'TN/TVR/2023/003', district: 'Tiruvallur', taluk: 'Avadi', valid: true },
  { surveyNumber: 'TN/TVR/2023/004', district: 'Tiruvallur', taluk: 'Gummidipoondi', valid: true },
  { surveyNumber: 'TN/TVR/2023/005', district: 'Tiruvallur', taluk: 'Tiruttani', valid: true },

  // 32. Tiruvannamalai
  { surveyNumber: 'TN/TNM/2023/001', district: 'Tiruvannamalai', taluk: 'Tiruvannamalai', valid: true },
  { surveyNumber: 'TN/TNM/2023/002', district: 'Tiruvannamalai', taluk: 'Cheyyar', valid: true },
  { surveyNumber: 'TN/TNM/2023/003', district: 'Tiruvannamalai', taluk: 'Polur', valid: true },
  { surveyNumber: 'TN/TNM/2023/004', district: 'Tiruvannamalai', taluk: 'Arani', valid: true },
  { surveyNumber: 'TN/TNM/2023/005', district: 'Tiruvannamalai', taluk: 'Vandavasi', valid: true },

  // 33. Tiruvarur
  { surveyNumber: 'TN/TUR/2023/001', district: 'Tiruvarur', taluk: 'Tiruvarur', valid: true },
  { surveyNumber: 'TN/TUR/2023/002', district: 'Tiruvarur', taluk: 'Mannargudi', valid: true },
  { surveyNumber: 'TN/TUR/2023/003', district: 'Tiruvarur', taluk: 'Nannilam', valid: true },
  { surveyNumber: 'TN/TUR/2023/004', district: 'Tiruvarur', taluk: 'Needamangalam', valid: true },
  { surveyNumber: 'TN/TUR/2023/005', district: 'Tiruvarur', taluk: 'Valangaiman', valid: true },

  // 34. Vellore
  { surveyNumber: 'TN/VLR/2023/001', district: 'Vellore', taluk: 'Vellore', valid: true },
  { surveyNumber: 'TN/VLR/2023/002', district: 'Vellore', taluk: 'Gudiyatham', valid: true },
  { surveyNumber: 'TN/VLR/2023/003', district: 'Vellore', taluk: 'Katpadi', valid: true },
  { surveyNumber: 'TN/VLR/2023/004', district: 'Vellore', taluk: 'Anaicut', valid: true },
  { surveyNumber: 'TN/VLR/2023/005', district: 'Vellore', taluk: 'Pernambut', valid: true },

  // 35. Villupuram
  { surveyNumber: 'TN/VPM/2023/001', district: 'Villupuram', taluk: 'Villupuram', valid: true },
  { surveyNumber: 'TN/VPM/2023/002', district: 'Villupuram', taluk: 'Tindivanam', valid: true },
  { surveyNumber: 'TN/VPM/2023/003', district: 'Villupuram', taluk: 'Vanur', valid: true },
  { surveyNumber: 'TN/VPM/2023/004', district: 'Villupuram', taluk: 'Vikravandi', valid: true },
  { surveyNumber: 'TN/VPM/2023/005', district: 'Villupuram', taluk: 'Gingee', valid: true },

  // 36. Virudhunagar
  { surveyNumber: 'TN/VRG/2023/001', district: 'Virudhunagar', taluk: 'Virudhunagar', valid: true },
  { surveyNumber: 'TN/VRG/2023/002', district: 'Virudhunagar', taluk: 'Aruppukkottai', valid: true },
  { surveyNumber: 'TN/VRG/2023/003', district: 'Virudhunagar', taluk: 'Sattur', valid: true },
  { surveyNumber: 'TN/VRG/2023/004', district: 'Virudhunagar', taluk: 'Rajapalayam', valid: true },
  { surveyNumber: 'TN/VRG/2023/005', district: 'Virudhunagar', taluk: 'Srivilliputhur', valid: true },

 
  // (continues for the remaining 23 districts…)
];


const seedSurveys = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB for survey seeding');

    // Clear existing survey data
    await Survey.deleteMany({});
    console.log('🗑️ Cleared existing survey data');

    // Insert new survey data with additional fields
    const surveysToInsert = surveyData.map(survey => ({
      ...survey,
      ownerDetails: {
        name: `Owner of ${survey.surveyNumber}`,
        documentNumber: `DOC${survey.surveyNumber.replace(/[^0-9]/g, '')}`
      },
      registrationDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date within last year
      lastVerified: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last month
      status: survey.status || 'active'
    }));

    const insertedSurveys = await Survey.insertMany(surveysToInsert);
    console.log(`✅ Inserted ${insertedSurveys.length} survey records`);

    // Create indexes for better performance
    await Survey.createIndexes();
    console.log('✅ Created database indexes');

    // Display statistics
    const stats = await Survey.aggregate([
      {
        $group: {
          _id: '$district',
          count: { $sum: 1 },
          validCount: { $sum: { $cond: ['$valid', 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log('\n📊 Survey Data Statistics by District:');
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.validCount}/${stat.count} valid surveys`);
    });

    console.log('\n🎯 Test Survey Numbers Available:');
    console.log('   Simple Format: 123456, 234567, 345678, 456789, 567890');
    console.log('   TN Format: TN/CHN/2023/001, TN/CBE/2023/002, etc.');

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    console.log('🚀 Survey data seeding completed successfully!');

  } catch (error) {
    console.error('❌ Survey seeding failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedSurveys();
}

module.exports = { seedSurveys, surveyData };