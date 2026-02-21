using ArabicTrainer.Api.Models;

namespace ArabicTrainer.Api.Services;

/// <summary>
/// Service layer for vocabulary operations.
///
/// This follows the Service Pattern - business logic lives here,
/// not in controllers/endpoints. This keeps the API layer thin
/// and the logic testable.
///
/// In a production app:
///   - This would inject an IRepository or DbContext
///   - Data would come from a database (SQLite, PostgreSQL, etc.)
///   - You'd add caching, validation, etc.
/// </summary>
public class VocabularyService
{
    private readonly List<VocabularyItem> _vocabulary;

    public VocabularyService()
    {
        _vocabulary = InitializeVocabulary();
    }

    public List<VocabularyItem> GetAll() => _vocabulary;

    public List<VocabularyItem> GetByCategory(string category) =>
        _vocabulary.Where(v =>
            v.Category.Equals(category, StringComparison.OrdinalIgnoreCase))
            .ToList();

    public List<object> GetCategories() =>
        _vocabulary
            .GroupBy(v => v.Category)
            .Select(g => new
            {
                Name = g.Key,
                Count = g.Count(),
                Icon = GetCategoryIcon(g.Key)
            })
            .Cast<object>()
            .ToList();

    public VocabularyItem? GetById(string id) =>
        _vocabulary.FirstOrDefault(v => v.Id == id);

    public void RecordAnswer(string vocabularyId, bool correct)
    {
        var item = GetById(vocabularyId);
        if (item == null) return;

        if (correct)
            item.TimesCorrect++;
        else
            item.TimesIncorrect++;

        item.LastReviewed = DateTime.UtcNow;
    }

    private static string GetCategoryIcon(string category) => category switch
    {
        "Greetings" => "hand-wave",
        "Numbers" => "hash",
        "Common Words" => "book-open",
        "Phrases" => "message-circle",
        _ => "folder"
    };

    private static List<VocabularyItem> InitializeVocabulary() => new()
    {
        // Greetings
        new() { Id = "g1", Arabic = "مرحبا", Transliteration = "marhaba", English = "Hello", Category = "Greetings", Difficulty = 1 },
        new() { Id = "g2", Arabic = "السلام عليكم", Transliteration = "as-salamu alaykum", English = "Peace be upon you", Category = "Greetings", Difficulty = 1 },
        new() { Id = "g3", Arabic = "صباح الخير", Transliteration = "sabah al-khayr", English = "Good morning", Category = "Greetings", Difficulty = 1 },
        new() { Id = "g4", Arabic = "مساء الخير", Transliteration = "masa al-khayr", English = "Good evening", Category = "Greetings", Difficulty = 1 },
        new() { Id = "g5", Arabic = "مع السلامة", Transliteration = "ma as-salama", English = "Goodbye", Category = "Greetings", Difficulty = 1 },
        new() { Id = "g6", Arabic = "شكرا", Transliteration = "shukran", English = "Thank you", Category = "Greetings", Difficulty = 1 },
        new() { Id = "g7", Arabic = "عفوا", Transliteration = "afwan", English = "You're welcome", Category = "Greetings", Difficulty = 1 },
        new() { Id = "g8", Arabic = "من فضلك", Transliteration = "min fadlik", English = "Please", Category = "Greetings", Difficulty = 1 },

        // Numbers
        new() { Id = "n1", Arabic = "واحد", Transliteration = "wahid", English = "One", Category = "Numbers", Difficulty = 1 },
        new() { Id = "n2", Arabic = "اثنان", Transliteration = "ithnan", English = "Two", Category = "Numbers", Difficulty = 1 },
        new() { Id = "n3", Arabic = "ثلاثة", Transliteration = "thalatha", English = "Three", Category = "Numbers", Difficulty = 1 },
        new() { Id = "n4", Arabic = "أربعة", Transliteration = "arba'a", English = "Four", Category = "Numbers", Difficulty = 1 },
        new() { Id = "n5", Arabic = "خمسة", Transliteration = "khamsa", English = "Five", Category = "Numbers", Difficulty = 1 },
        new() { Id = "n6", Arabic = "عشرة", Transliteration = "ashara", English = "Ten", Category = "Numbers", Difficulty = 1 },
        new() { Id = "n7", Arabic = "مئة", Transliteration = "mi'a", English = "Hundred", Category = "Numbers", Difficulty = 2 },
        new() { Id = "n8", Arabic = "ألف", Transliteration = "alf", English = "Thousand", Category = "Numbers", Difficulty = 2 },

        // Common Words
        new() { Id = "c1", Arabic = "ماء", Transliteration = "ma'", English = "Water", Category = "Common Words", Difficulty = 1 },
        new() { Id = "c2", Arabic = "طعام", Transliteration = "ta'am", English = "Food", Category = "Common Words", Difficulty = 1 },
        new() { Id = "c3", Arabic = "بيت", Transliteration = "bayt", English = "House", Category = "Common Words", Difficulty = 1 },
        new() { Id = "c4", Arabic = "كتاب", Transliteration = "kitab", English = "Book", Category = "Common Words", Difficulty = 1 },
        new() { Id = "c5", Arabic = "سيارة", Transliteration = "sayyara", English = "Car", Category = "Common Words", Difficulty = 2 },
        new() { Id = "c6", Arabic = "مدرسة", Transliteration = "madrasa", English = "School", Category = "Common Words", Difficulty = 2 },
        new() { Id = "c7", Arabic = "صديق", Transliteration = "sadiq", English = "Friend", Category = "Common Words", Difficulty = 2 },
        new() { Id = "c8", Arabic = "عائلة", Transliteration = "a'ila", English = "Family", Category = "Common Words", Difficulty = 2 },

        // Phrases
        new() { Id = "p1", Arabic = "كيف حالك؟", Transliteration = "kayf halak?", English = "How are you?", Category = "Phrases", Difficulty = 2 },
        new() { Id = "p2", Arabic = "ما اسمك؟", Transliteration = "ma ismak?", English = "What is your name?", Category = "Phrases", Difficulty = 2 },
        new() { Id = "p3", Arabic = "أنا بخير", Transliteration = "ana bikhayr", English = "I am fine", Category = "Phrases", Difficulty = 2 },
        new() { Id = "p4", Arabic = "اسمي...", Transliteration = "ismi...", English = "My name is...", Category = "Phrases", Difficulty = 2 },
        new() { Id = "p5", Arabic = "أين الحمام؟", Transliteration = "ayn al-hammam?", English = "Where is the bathroom?", Category = "Phrases", Difficulty = 3 },
        new() { Id = "p6", Arabic = "كم الساعة؟", Transliteration = "kam as-sa'a?", English = "What time is it?", Category = "Phrases", Difficulty = 3 },
    };
}
