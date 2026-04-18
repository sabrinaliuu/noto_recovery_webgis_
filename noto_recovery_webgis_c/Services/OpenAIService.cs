// OpenAI API usage for sentiment analysis 
// same as OpenAI function in Flask
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace noto_recovery_webgis_c.Services
{
    public class OpenAIService
    {
        private readonly HttpClient _http;
        private readonly IConfiguration _config;

        public OpenAIService(HttpClient http, IConfiguration config)
        {
            _http = http;
            _config = config;
        }

        public async Task<string> SentimentAsync(string text)
        {
            var apiKey = _config["OPENAI_API_KEY"];

            var requestBody = new
            {
                model = "gpt-4o",
                messages = new[]
                {
                new {
                    role = "system",
                    content = @"災害復興に関する文章を読んで感情分析してください。
                                ポジは1、ネガは-1、なしは0。
                                結果だけ返してください。"
                },
                new {
                    role = "user",
                    content = text
                }
            }
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            var response = await _http.SendAsync(request);
            var json = await response.Content.ReadAsStringAsync();

            using var doc = JsonDocument.Parse(json);
            var result = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            return result switch
            {
                "1" => "Positive",
                "0" => "Neutral",
                "-1" => "Negative",
                _ => "Neutral"
            };
        }
    }
}
