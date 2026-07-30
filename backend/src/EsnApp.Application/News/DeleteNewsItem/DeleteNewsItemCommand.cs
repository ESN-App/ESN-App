using EsnApp.Application.Common;
using MediatR;

namespace EsnApp.Application.News.DeleteNewsItem;

public record DeleteNewsItemCommand(Guid Id) : IRequest<Result<bool>>;
