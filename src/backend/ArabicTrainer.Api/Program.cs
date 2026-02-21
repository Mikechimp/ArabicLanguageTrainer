/**
 * C# .NET Backend Entry Point
 *
 * This is a minimal ASP.NET Core Web API that serves as the
 * backend service for the Arabic Language Trainer.
 *
 * Architecture:
 *   Electron Main Process → spawns this as a child process
 *   This process → listens on localhost:5175
 *   Electron Renderer → sends requests via IPC → Main → HTTP → here
 *
 * To run standalone (for development):
 *   dotnet run --project src/backend/ArabicTrainer.Api
 */

using ArabicTrainer.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// ─── Service Registration (Dependency Injection) ─────────────────────
// This is the DI container pattern - a core concept in enterprise C#
builder.Services.AddSingleton<VocabularyService>();
builder.Services.AddSingleton<QuizService>();
builder.Services.AddSingleton<ProgressService>();

// Configure CORS for local Electron communication
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseCors();

// ─── API Endpoints ───────────────────────────────────────────────────
// Using Minimal APIs (introduced in .NET 6) - clean, fast, no controllers needed

// Health check
app.MapGet("/api/health", () => new
{
    Status = "healthy",
    Mode = "dotnet",
    Timestamp = DateTime.UtcNow
});

// Vocabulary endpoints
app.MapGet("/api/vocabulary", (VocabularyService vocab) =>
    vocab.GetAll());

app.MapGet("/api/vocabulary/{category}", (string category, VocabularyService vocab) =>
    vocab.GetByCategory(category));

app.MapGet("/api/categories", (VocabularyService vocab) =>
    vocab.GetCategories());

// Quiz endpoints
app.MapGet("/api/quiz", (QuizService quiz) =>
    quiz.GenerateQuiz());

app.MapPost("/api/quiz/submit", (QuizSubmission submission, QuizService quiz) =>
    quiz.SubmitAnswer(submission));

// Progress endpoints
app.MapGet("/api/progress", (ProgressService progress) =>
    progress.GetProgress());

app.Run();

// ─── Request/Response Types ──────────────────────────────────────────

public record QuizSubmission(string VocabularyId, bool Correct, DateTime AnsweredAt);
