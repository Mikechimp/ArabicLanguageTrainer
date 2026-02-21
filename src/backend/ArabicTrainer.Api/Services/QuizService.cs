using ArabicTrainer.Api.Models;

namespace ArabicTrainer.Api.Services;

/// <summary>
/// Service for generating and scoring quizzes.
/// Demonstrates the Single Responsibility Principle -
/// quiz logic is separate from vocabulary management.
/// </summary>
public class QuizService
{
    private readonly VocabularyService _vocabulary;
    private int _streak;

    public QuizService(VocabularyService vocabulary)
    {
        _vocabulary = vocabulary;
    }

    public List<QuizQuestion> GenerateQuiz(int count = 10)
    {
        var random = new Random();
        var allWords = _vocabulary.GetAll();
        var selected = allWords.OrderBy(_ => random.Next()).Take(count).ToList();

        return selected.Select(item =>
        {
            // Generate wrong answers from other vocabulary
            var wrongAnswers = allWords
                .Where(v => v.Id != item.Id)
                .OrderBy(_ => random.Next())
                .Take(3)
                .Select(v => v.English)
                .ToList();

            var options = new List<string> { item.English };
            options.AddRange(wrongAnswers);
            options = options.OrderBy(_ => random.Next()).ToList();

            return new QuizQuestion
            {
                Id = $"q_{item.Id}_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                VocabularyId = item.Id,
                Arabic = item.Arabic,
                Transliteration = item.Transliteration,
                CorrectAnswer = item.English,
                Options = options,
                Category = item.Category
            };
        }).ToList();
    }

    public object SubmitAnswer(QuizSubmission submission)
    {
        _vocabulary.RecordAnswer(submission.VocabularyId, submission.Correct);

        if (submission.Correct)
            _streak++;
        else
            _streak = 0;

        return new { Success = true, Streak = _streak };
    }
}
