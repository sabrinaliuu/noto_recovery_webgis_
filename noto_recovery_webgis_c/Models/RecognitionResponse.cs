namespace noto_recovery_webgis_c.Models
{
    public class RecognitionResponse
    {
        public List<string> Elements { get; set; }
        public List<string> Places { get; set; }
        public string Sentiment { get; set; }
    }
}
