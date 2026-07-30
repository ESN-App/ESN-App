using EsnApp.Domain.News;

namespace EsnApp.Infrastructure.Persistence;

public static class NewsSeedData
{
    public static IReadOnlyList<NewsItem> Create() =>
    [
        new NewsItem
        {
            Title = "Orientation Week is almost here",
            Description = "Meet the ESN Gdańsk team, discover the city and start your semester with other international students.",
            ImagePath = "/images/news-orientation.jpg",
            DisplayOrder = 0,
            Status = NewsItemStatus.Published,
        },
        new NewsItem
        {
            Title = "Catch the Baltic sunset with us",
            Description = "Join an evening sailing experience and see the Tricity coastline from a completely different perspective.",
            ImagePath = "/images/news-sailing.jpg",
            DisplayOrder = 1,
            Status = NewsItemStatus.Published,
        },
        new NewsItem
        {
            Title = "Your first-week guide to Gdańsk",
            Description = "A quick guide to transport, useful places and local essentials for your first days in Gdańsk.",
            ImagePath = "/images/news-guide.jpg",
            DisplayOrder = 2,
            Status = NewsItemStatus.Published,
        },
    ];
}
