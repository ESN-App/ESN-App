namespace EsnApp.Api.Services;

public class EventImageStorage(IWebHostEnvironment environment)
{
    public const long MaximumBytes = 8 * 1024 * 1024;

    private static readonly IReadOnlyDictionary<string, string> AllowedTypes =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["image/jpeg"] = ".jpg",
            ["image/png"] = ".png",
            ["image/webp"] = ".webp",
        };

    public async Task<string?> SaveAsync(IFormFile? image, CancellationToken cancellationToken)
    {
        if (image is null)
        {
            return null;
        }

        if (image.Length is <= 0 or > MaximumBytes)
        {
            throw new InvalidOperationException("Event image must be between 1 byte and 8 MB.");
        }

        if (!AllowedTypes.TryGetValue(image.ContentType, out var extension))
        {
            throw new InvalidOperationException("Event image must be a JPEG, PNG, or WebP file.");
        }

        var uploadsDirectory = Path.Combine(
            environment.WebRootPath,
            "images",
            "uploads",
            "events");
        Directory.CreateDirectory(uploadsDirectory);

        var fileName = $"{Guid.NewGuid():N}{extension}";
        var physicalPath = Path.Combine(uploadsDirectory, fileName);
        await using var stream = new FileStream(
            physicalPath,
            FileMode.CreateNew,
            FileAccess.Write,
            FileShare.None,
            81920,
            useAsync: true);
        await image.CopyToAsync(stream, cancellationToken);

        return $"/api/images/uploads/events/{fileName}";
    }

    public void Delete(string? publicPath)
    {
        // Only uploaded images are owned by this storage. The seeded items point at
        // frontend assets under /images/, which must survive edits and deletes.
        if (publicPath is null ||
            !publicPath.StartsWith("/api/images/uploads/events/", StringComparison.Ordinal))
        {
            return;
        }

        var fileName = Path.GetFileName(publicPath);
        if (string.IsNullOrWhiteSpace(fileName))
        {
            return;
        }

        var physicalPath = Path.Combine(
            environment.WebRootPath,
            "images",
            "uploads",
            "events",
            fileName);
        if (File.Exists(physicalPath))
        {
            File.Delete(physicalPath);
        }
    }
}
