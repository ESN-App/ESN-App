using EsnApp.Application.Common;
using EsnApp.Application.News.Common;
using MediatR;

namespace EsnApp.Application.News.UpdateNewsItem;

public record UpdateNewsItemCommand(
    Guid Id,
    string Title,
    string Description,
    string ImagePath) : IRequest<Result<NewsItemDto>>;
