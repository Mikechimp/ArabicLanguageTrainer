namespace ArabicTrainer.Api.Models;

/// <summary>
/// A generated quiz question with multiple-choice options.
/// Created dynamically from the vocabulary pool.
/// </summary>
public class QuizQuestion
{
    public required string Id { get; set; }
    public required string VocabularyId { get; set; }
    public required string Arabic { get; set; }
    public required string Transliteration { get; set; }
    public required string CorrectAnswer { get; set; }
    public required List<string> Options { get; set; }
    public required string Category { get; set; }
}
