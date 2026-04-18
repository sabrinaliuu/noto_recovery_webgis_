namespace noto_recovery_webgis_c.Services
{
    public class RecoveryService
    {
        private readonly List<string> cities = new()
    {
        "珠洲市","羽咋市","志賀町","宝達志水町","七尾市",
        "能登町","輪島市","内灘町","かほく市","穴水町",
        "津幡町","中能登町"
    };

        private readonly Dictionary<int, List<string>> keywords = new()
    {
        {1, new(){"仮設住宅","半壊","全壊","住宅被害","家屋","住まい","再建","住宅","住民","建物","家は","家で"}},
        {2, new(){"祭り","まつり","協力","ボランティア","絆","祈願","祈り"}},
        {3, new(){"土砂崩落","人口","開通","解体","朝市","交通","インフラ","鉄道"}},
        {4, new(){"不安","沈む","絶望","痛む","希望","元気","寂しい","悲しい","うれしい"}},
        {5, new(){"防災","整備","備え"}},
        {6, new(){"アンケート","公的支援","政府","公費","支援","取り組み","行政","予算"}},
        {7, new(){"仮設商店","寄付","義援金","奨学金","輪島塗","ツアー","輪島朝市","住宅ローン","再開","支援"}}
    };

        public List<string> ExtractCities(string text)
        {
            return cities.Where(c => text.Contains(c)).ToList();
        }

        public List<string> RecoveryElements(string text)
        {
            var result = new List<string>();

            foreach (var k in keywords)
            {
                if (k.Value.Any(w => text.Contains(w)))
                {
                    result.Add(GetLabel(k.Key));
                }
            }

            return result;
        }

        private string GetLabel(int key)
        {
            return key switch
            {
                1 => "housing",
                2 => "social ties",
                3 => "townscape",
                4 => "physical and mental health",
                5 => "preparedness",
                6 => "relation to government",
                7 => "economic and financial situation",
                _ => ""
            };
        }
    }
}
