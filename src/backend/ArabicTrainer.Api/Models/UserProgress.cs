namespace ArabicTrainer.Api.Models;

/// <summary>
/// Aggregated user progress across all categories.
/// </summary>
public class UserProgress
{
    public int TotalWords { get; set; }
    public int WordsLearned { get; set; }
    public int Accuracy { get; set; }
    public int Streak { get; set; }
    public DateTime? LastSession { get; set; }
    public Dictionary<string, CategoryProgress> CategoryProgress { get; set; } = new();
}

public class CategoryProgress
{
    public int Learned { get; set; }
    public int Total { get; set; }
}
