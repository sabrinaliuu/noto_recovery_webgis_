using Microsoft.AspNetCore.Mvc;
using noto_recovery_webgis_c.Services;
using noto_recovery_webgis_c.Models;

namespace noto_recovery_webgis_c.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    public class RecognitionController : Controller
    {

        private readonly RecoveryService _recovery;
        private readonly OpenAIService _openai;

        public RecognitionController(RecoveryService recovery, OpenAIService openai)
        {
            _recovery = recovery;
            _openai = openai;
        }

        [HttpPost("analyze")]
        public async Task<IActionResult> Analyze([FromBody] RecognitionRequest request)
        {
            var text = request.Text;

            var result = new RecognitionResponse
            {
                Elements = _recovery.RecoveryElements(text),
                Places = _recovery.ExtractCities(text),
                Sentiment = await _openai.SentimentAsync(text)
            };

            return Ok(result);
        }
    }
}


