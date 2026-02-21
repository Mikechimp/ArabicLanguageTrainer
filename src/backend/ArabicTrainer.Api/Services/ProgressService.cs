using ArabicTrainer.Api.Models;

namespace ArabicTrainer.Api.Services;

/// <summary>
/// Service for computing user progress statistics.
/// Aggregates data from the vocabulary service.
/// </summary>
public class ProgressService
{
    private readonly VocabularyService _vocabulary;

    public ProgressService(VocabularyService vocabulary)
    {
        _vocabulary = vocabulary;
    }

    public UserProgress GetProgress()
    {
        var allWords = _vocabulary.GetAll();
        var totalWords = allWords.Count;
        var wordsLearned = allWords.Count(v => v.TimesCorrect >= 3);
        var totalAttempts = allWords.Sum(v => v.TimesCorrect + v.TimesIncorrect);
        var totalCorrect = allWords.Sum(v => v.TimesCorrect);
        var accuracy = totalAttempts > 0
            ? (int)Math.Round((double)totalCorrect / totalAttempts * 100)
            : 0;

        var lastReviewed = allWords
            .Where(v => v.LastReviewed.HasValue)
            .OrderByDescending(v => v.LastReviewed)
            .FirstOrDefault();

        var categoryProgress = allWords
            .GroupBy(v => v.Category)
            .ToDictionary(
                g => g.Key,
                g => new CategoryProgress
                {
                    Learned = g.Count(v => v.TimesCorrect >= 3),
                    Total = g.Count()
                }
            );

        return new UserProgress
        {
            TotalWords = totalWords,
            WordsLearned = wordsLearned,
            Accuracy = accuracy,
            Streak = 0, // Streak is managed by QuizService
            LastSession = lastReviewed?.LastReviewed,
            CategoryProgress = categoryProgress
        };
    }
}
