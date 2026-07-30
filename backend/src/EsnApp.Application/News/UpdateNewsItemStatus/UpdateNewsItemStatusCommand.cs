using EsnApp.Application.Common;
using EsnApp.Application.News.Common;
using EsnApp.Domain.News;
using MediatR;

namespace EsnApp.Application.News.UpdateNewsItemStatus;

public record UpdateNewsItemStatusCommand(Guid Id, NewsItemStatus Status)
    : IRequest<Result<NewsItemDto>>;
