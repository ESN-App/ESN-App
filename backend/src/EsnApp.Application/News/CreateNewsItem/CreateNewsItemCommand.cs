using EsnApp.Application.Common;
using EsnApp.Application.News.Common;
using MediatR;

namespace EsnApp.Application.News.CreateNewsItem;

public record CreateNewsItemCommand(
    string Title,
    string Description,
    string ImagePath) : IRequest<Result<NewsItemDto>>;
