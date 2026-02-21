namespace ArabicTrainer.Api.Models;

/// <summary>
/// Represents a single vocabulary entry in the Arabic trainer.
/// This is the core data model - everything else references it.
///
/// In a production app, this would map to a database table via Entity Framework.
/// For now, we use in-memory storage with JSON file persistence.
/// </summary>
public class VocabularyItem
{
    public required string Id { get; set; }
    public required string Arabic { get; set; }
    public required string Transliteration { get; set; }
    public required string English { get; set; }
    public required string Category { get; set; }
    public int Difficulty { get; set; } = 1;
    public int TimesCorrect { get; set; } = 0;
    public int TimesIncorrect { get; set; } = 0;
    public DateTime? LastReviewed { get; set; }
}
