using EsnApp.Application.Common;
using EsnApp.Application.News.Abstractions;
using MediatR;

namespace EsnApp.Application.News.DeleteNewsItem;

public class DeleteNewsItemCommandHandler(INewsItemRepository repository)
    : IRequestHandler<DeleteNewsItemCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(
        DeleteNewsItemCommand request,
        CancellationToken cancellationToken)
    {
        var deleted = await repository.DeleteAsync(request.Id, cancellationToken);

        return deleted
            ? Result.Success(true)
            : Result.Failure<bool>($"News item '{request.Id}' was not found.");
    }
}
